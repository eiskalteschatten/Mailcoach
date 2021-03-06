import { Request, Response } from 'express';

import { returnError } from '@mc/lib/apiErrorHandling';
import AbstractController from '@mc/modules/AbstractController';
import { HttpError } from '@mc/lib/Error';
import authPassport from '@mc/lib/middleware/authPassport';
import User from '@mc/modules/auth/models/User';

import Folder from '../models/Folder';
import Feed from '../models/Feed';

import { serialize, deserializeModelCreateUpdate } from '../serializer/folders';

class FoldersController extends AbstractController {
  constructor() {
    super();
    this.initilizeRoutes();
  }

  private initilizeRoutes(): void {
    this.router.get('/', authPassport, this.getAllFolders);
    this.router.get('/with-feeds', authPassport, this.getAllFoldersWithFeeds);
    this.router.post('/', authPassport, this.createFolder);
    this.router.put('/:id', authPassport, this.updateFolder);
    this.router.delete('/:id', authPassport, this.deleteFolder);
  }

  /**
   * @api {get} /api/rss/folders Get All Folders
   * @apiName GetAllFolders
   * @apiGroup RSS
   * @apiVersion 1.0.0
   *
   * @apiHeaderExample {json} Header-Example:
   *  {
   *    "Authorization": "Bearer accessToken"
   *  }
   *
   * @apiSuccessExample {json} Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *    "folders": [
   *      {
   *        "id": 1,
   *        "name": ""
   *      }
   *    ]
   *  }
   */

  private async getAllFolders(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as User;

      const folders = await Folder.findAll({
        order: [
          ['name', 'DESC']
        ],
        where: {
          fkUser: user.id
        }
      });

      res.json({
        folders: folders.map(serialize)
      });
    }
    catch(error) {
      returnError(error as HttpError, req, res);
    }
  }

  /**
   * @api {get} /api/rss/folders/with-feeds Get All Folders with Feeds
   * @apiName GetAllFoldersWithFeeds
   * @apiGroup RSS
   * @apiVersion 1.0.0
   *
   * @apiHeaderExample {json} Header-Example:
   *  {
   *    "Authorization": "Bearer accessToken"
   *  }
   *
   * @apiSuccessExample {json} Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *    "folders": [
   *      {
   *        "id": 1,
   *        "name": "",
   *        "feeds": [{
   *          "id": 1,
   *          "name": "",
   *          "feedUrl": "",
   *          "link": "",
   *          "icon": ""
   *        }]
   *      }
   *    ]
   *  }
   */

  private async getAllFoldersWithFeeds(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as User;

      const folders = await Folder.findAll({
        order: [
          ['name', 'DESC']
        ],
        where: {
          fkUser: user.id
        },
        include: [{
          model: Feed,
          as: 'feeds',
          order: [
            ['name', 'DESC']
          ]
        }]
      });

      res.json({
        folders: folders.map(serialize)
      });
    }
    catch(error) {
      returnError(error as HttpError, req, res);
    }
  }

  /**
   * @api {post} /api/rss/folders Create a Folder
   * @apiName CreateAFolder
   * @apiGroup RSS
   * @apiVersion 1.0.0
   *
   * @apiParam {string} name The folder's name.
   *
   * @apiParamExample {json} Request-Example:
   *  {
   *    "name": ""
   *  }
   *
   * @apiHeaderExample {json} Header-Example:
   *  {
   *    "Authorization": "Bearer accessToken"
   *  }
   *
   * @apiSuccessExample {json} Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *    "folder": {
   *      "id": 1,
   *      "name": ""
   *    }
   *  }
   */

  private async createFolder(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as User;
      const deserialized = deserializeModelCreateUpdate(req.body);

      const folder = await Folder.create({
        ...deserialized,
        fkUser: user.id
      });

      res.json({
        folder: serialize(folder)
      });
    }
    catch(error) {
      returnError(error as HttpError, req, res);
    }
  }

  /**
   * @api {put} /api/rss/folders/:id Update a Folder
   * @apiName UpdateAFolder
   * @apiGroup RSS
   * @apiVersion 1.0.0
   *
   * @apiParam {number} id The folder's ID.
   * @apiParam {string} [name] The folder's name.
   *
   * @apiParamExample {json} Request-Example:
   *  {
   *    "name": ""
   *  }
   *
   * @apiHeaderExample {json} Header-Example:
   *  {
   *    "Authorization": "Bearer accessToken"
   *  }
   *
   * @apiSuccessExample {json} Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *    "folder": {
   *      "id": 1,
   *      "name": ""
   *    }
   *  }
   */

  private async updateFolder(req: Request, res: Response): Promise<void> {
    try {
      const deserialized = deserializeModelCreateUpdate(req.body);
      const folder = await Folder.findByPk(req.params.id);

      await folder.update(deserialized);

      res.json({
        folder: serialize(folder)
      });
    }
    catch(error) {
      returnError(error as HttpError, req, res);
    }
  }

  /**
   * @api {delete} /api/rss/folders/:id Delete a Folder
   * @apiName DeleteAFolder
   * @apiGroup RSS
   * @apiVersion 1.0.0
   *
   * @apiParam {number} id The folder's ID.
   *
   * @apiHeaderExample {json} Header-Example:
   *  {
   *    "Authorization": "Bearer accessToken"
   *  }
   *
   * @apiSuccessExample {json} Success-Response:
   *  HTTP/1.1 204 No Content
   */

  private async deleteFolder(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as User;
      const id = req.params.id;

      await Feed.destroy({
        where: {
          fkFolder: id,
          fkUser: user.id
        }
      });

      await Folder.destroy({ where: { id } });

      res.status(204).send('');
    }
    catch(error) {
      returnError(error as HttpError, req, res);
    }
  }
}

export default new FoldersController();
