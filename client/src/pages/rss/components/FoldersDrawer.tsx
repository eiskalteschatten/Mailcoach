import React, { useEffect, useContext, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import clsx from 'clsx';

import {
  createStyles,
  Theme,
  makeStyles,
  Drawer,
  Divider,
  IconButton,
  List,
  ListSubheader,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Menu
} from '@material-ui/core';

import FolderIcon from '@material-ui/icons/Folder';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import NewReleasesIcon from '@material-ui/icons/NewReleases';
import RssFeedIcon from '@material-ui/icons/RssFeed';
import ArchiveIcon from '@material-ui/icons/Archive';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import CreateIcon from '@material-ui/icons/Create';
import CreateNewFolderIcon from '@material-ui/icons/CreateNewFolder';
import AddCircleIcon from '@material-ui/icons/AddCircle';

import ComponentLoader from '../../../components/ComponentLoader';

import { State } from '../../../store';
import { folderGetAllWithFeeds } from '../../../store/actions/rss/folderActions';
import { IntlContext } from '../../../intl/IntlContext';
import { SerializedModel as Folder } from '../../../../../interfaces/rss/Folder';
import { SerializedModel as Feed } from '../../../../../interfaces/rss/Feed';

import EditDialog from './EditDialog';

const drawerWidth = 325;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexShrink: 0,
      [theme.breakpoints.up('sm')]: {
        width: drawerWidth
      }
    },
    drawerPaper: {
      width: '100%',
      [theme.breakpoints.up('sm')]: {
        width: drawerWidth
      }
    },
    toolbar: theme.mixins.toolbar,
    folderList: {
      flex: 'auto'
    },
    listItem: {
      '&:hover': {
        '& $listItemMenu': {
          display: 'inline !important'
        }
      }
    },
    listItemMenu: {
      display: 'none'
    },
    nested: {
      paddingLeft: theme.spacing(4)
    },
    editButtonWrapper: {
      textAlign: 'right'
    }
  })
);

const FolderDrawer: React.FC = () => {
  const classes = useStyles();
  const { messages } = useContext(IntlContext);
  const folders = useSelector((state: State) => state.rss.folder.folders) as Folder[];
  const leftDrawerOpen = useSelector((state: State) => state.app.leftDrawerOpen);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const dispatch = useDispatch();
  const [openFolders, setOpenFolders] = useState<any>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!folders || folders.length === 0) {
      setIsLoading(true);
      dispatch(folderGetAllWithFeeds());
    }
  }, [folders, dispatch]);

  useEffect(() => {
    if (folders && folders.length > 0) {
      for (const folder of folders) {
        setOpenFolders((allOpenFolders: any) => ({
          ...allOpenFolders,
          [folder.id]: true
        }));
      }
    }
  }, [folders]);

  const handleToggleFolder = (id: number) => {
    setOpenFolders({
      ...openFolders,
      [id]: !openFolders[id]
    });
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenEditDialog = () => {
    handleMenuClose();
    setEditDialogOpen(true);
  };

  return (<Drawer
    className={clsx({
      [classes.root]: leftDrawerOpen
    })}
    variant='persistent'
    anchor='left'
    open={leftDrawerOpen}
    classes={{
      paper: classes.drawerPaper
    }}
  >
    <ComponentLoader isLoading={isLoading} />

    <div className={classes.toolbar} />

    <List>
      <ListItem button>
        <ListItemIcon>
          <RssFeedIcon />
        </ListItemIcon>
        <ListItemText primary={messages.allItems} />
      </ListItem>

      <ListItem button>
        <ListItemIcon>
          <NewReleasesIcon />
        </ListItemIcon>
        <ListItemText primary={messages.unreadItems} />
      </ListItem>

      <ListItem button>
        <ListItemIcon>
          <ArchiveIcon />
        </ListItemIcon>
        <ListItemText primary={messages.archive} />
      </ListItem>
    </List>

    <Divider />

    <div className={classes.folderList}>
      <List
        subheader={
          <ListSubheader component='div' id='nested-list-subheader'>
            {messages['rssFeeds.feeds']}
          </ListSubheader>
        }
      >
        {folders.map((folder: Folder) => (
          <span className={classes.listItem} key={folder.id}>
            <ListItem button>
              <ListItemIcon>
                <FolderIcon />
              </ListItemIcon>
              <ListItemText primary={folder.name} />
              {openFolders[folder.id]
                ? <ExpandLessIcon onClick={() => handleToggleFolder(folder.id)} />
                : <ExpandMoreIcon onClick={() => handleToggleFolder(folder.id)} />
              }
            </ListItem>

            {folder.feeds && folder.feeds.map((feed: Feed) => (
              <Collapse in={openFolders[folder.id]} timeout='auto' unmountOnExit key={feed.id}>
                <List component='div' disablePadding>
                  <ListItem button className={classes.nested}>
                    <ListItemText primary={feed.name} />
                  </ListItem>
                </List>
              </Collapse>
            ))}
          </span>
        ))}
      </List>
    </div>

    <div className={classes.editButtonWrapper}>
      <IconButton onClick={handleMenuOpen}>
        <MoreHorizIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <List component='nav'>
          <ListItem button onClick={handleOpenEditDialog}>
            <ListItemIcon>
              <CreateIcon />
            </ListItemIcon>
            <ListItemText primary={messages['rssFeeds.editFoldersAndFeeds']} />
          </ListItem>
          <Divider />
          <ListItem button>
            <ListItemIcon>
              <AddCircleIcon />
            </ListItemIcon>
            <ListItemText primary={messages['rssFeeds.addFeed']} />
          </ListItem>
          <ListItem button>
            <ListItemIcon>
              <CreateNewFolderIcon />
            </ListItemIcon>
            <ListItemText primary={messages['rssFeeds.addFolder']} />
          </ListItem>
        </List>
      </Menu>
    </div>

    <EditDialog
      open={editDialogOpen}
      handleClose={() => setEditDialogOpen(false)}
    />
  </Drawer>);
}

export default FolderDrawer;
