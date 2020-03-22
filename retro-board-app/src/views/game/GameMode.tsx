import React, { useCallback } from 'react';
import styled from 'styled-components';
import { Post, PostGroup } from 'retro-board-common';
import { Typography, makeStyles, Box } from '@material-ui/core';
import {
  DragDropContext,
  DropResult,
  ResponderProvided,
} from 'react-beautiful-dnd';
import useTranslations from '../../translations';
import useGlobalState from '../../state';
import useRemainingVotes from './useRemainingVotes';
import { getIcon } from '../../state/icons';
import Column from './Column';
import EditableLabel from '../../components/EditableLabel';
import { Page } from '../../components/Page';
import { ColumnContent } from './types';
import RemainingVotes from './RemainingVotes';
import useUser from '../../auth/useUser';
import { Alert } from '@material-ui/lab';
import { getMovingEntities, getCombiningEntities } from './moving-logic';

interface GameModeProps {
  columns: ColumnContent[];
  onRenameSession: (name: string) => void;
  onAddPost: (columnIndex: number, content: string) => void;
  onAddGroup: (columnIndex: number) => void;
  onMovePost: (
    post: Post,
    destinationGroup: PostGroup | null,
    destinationColumn: number,
    destinationIndex: number
  ) => void;
  onCombinePost: (post1: Post, post2: Post) => void;
  onDeletePost: (post: Post) => void;
  onLike: (post: Post, like: boolean) => void;
  onEdit: (post: Post) => void;
  onEditGroup: (group: PostGroup) => void;
  onDeleteGroup: (group: PostGroup) => void;
}

const useStyles = makeStyles({
  sessionName: {
    fontWeight: 300,
  },
  container: {
    marginTop: 20,
  },
});

function GameMode({
  onRenameSession,
  onAddPost,
  onAddGroup,
  onMovePost,
  onCombinePost,
  onDeletePost,
  onLike,
  onEdit,
  onEditGroup,
  onDeleteGroup,
  columns,
}: GameModeProps) {
  const translations = useTranslations();
  const { state } = useGlobalState();
  const classes = useStyles();
  const remainingVotes = useRemainingVotes();
  const user = useUser();
  const isLoggedIn = !!user;

  const handleOnDragEnd = useCallback(
    (result: DropResult, provided: ResponderProvided) => {
      console.log('Drag end', result, provided);

      if (!!result.destination) {
        const entities = getMovingEntities(
          result.draggableId,
          result.destination.droppableId,
          result.destination.index,
          columns
        );
        if (entities) {
          console.log('Corretly found entities: ', entities);
          onMovePost(
            entities.post,
            entities.targetGroup,
            entities.targetColumn,
            entities.targetIndex
          );
        }
      }
      if (!!result.combine) {
        const entities = getCombiningEntities(
          result.draggableId,
          result.combine.draggableId,
          columns
        );
        console.log('Comlbining: ', entities);
        if (entities) {
          onCombinePost(entities.post1, entities.post2);
        }
      }
    },
    [onMovePost, onCombinePost, columns]
  );

  if (!state.session) {
    return <span>Loading...</span>;
  }

  return (
    <Page>
      {!isLoggedIn ? (
        <Alert severity="warning">
          You are not logged in. You can view this session as a spectator, but
          must login to participate.
        </Alert>
      ) : null}
      <Box className={classes.container}>
        <HeaderWrapper>
          <div />
          <Typography
            variant="h5"
            align="center"
            gutterBottom
            paragraph
            className={classes.sessionName}
          >
            <EditableLabel
              placeholder={translations.SessionName.defaultSessionName}
              value={state.session.name || ''}
              centered
              onChange={onRenameSession}
              readOnly={!isLoggedIn}
            />
          </Typography>
          <RemainingVotes up={remainingVotes.up} down={remainingVotes.down} />
        </HeaderWrapper>

        <DragDropContext onDragEnd={handleOnDragEnd}>
          <Columns numberOfColumns={columns.length}>
            {columns.map(column => (
              <Column
                column={column}
                key={column.index}
                posts={column.posts}
                groups={column.groups}
                question={column.label}
                icon={getIcon(column.icon)}
                color={column.color}
                onAdd={content => onAddPost(column.index, content)}
                onAddGroup={() => onAddGroup(column.index)}
                onDelete={onDeletePost}
                onLike={post => onLike(post, true)}
                onDislike={post => onLike(post, false)}
                onEdit={onEdit}
                onEditGroup={onEditGroup}
                onDeleteGroup={onDeleteGroup}
              />
            ))}
          </Columns>
        </DragDropContext>
      </Box>
    </Page>
  );
}

const Columns = styled.div<{ numberOfColumns: number }>`
  display: flex;
  margin-top: 30px;

  @media screen and (max-width: ${props =>
      props.numberOfColumns * 320 + 100}px) {
    margin-top: 10px;
    flex-direction: column;

    > * {
      margin-bottom: 20px;
    }
  }
`;

const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  > *:first-child {
    width: 90px;
  }

  > *:nth-child(2) {
    flex: 1;
    margin: 0 20px;
  }

  > *:last-child {
    width: 90px;
  }

  @media (max-width: 500px) {
    margin-top: 40px;
    flex-direction: column;

    > *:last-child {
      margin: 20px 0;
    }
  }
`;

export default GameMode;
