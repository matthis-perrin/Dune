import * as React from 'react';
import styled from 'styled-components';

import {theme} from '@root/theme';

import {Stop} from '@shared/models';

interface StopCommentFormProps {
  stop: Stop;
  onCommentAdded(comment: string): void;
}

interface StopCommentFormState {
  currentComment: string;
}

export class StopCommentForm extends React.Component<StopCommentFormProps, StopCommentFormState> {
  public static displayName = 'StopCommentForm';

  public constructor(props: StopCommentFormProps) {
    super(props);
    this.state = {currentComment: ''};
  }

  private readonly handleInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const {currentComment} = this.state;
      const {onCommentAdded} = this.props;
      if (currentComment.length > 0) {
        this.setState({currentComment: ''});
        onCommentAdded(currentComment);
      }
    }
  };

  private readonly handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({currentComment: event.target.value});
  };

  public render(): JSX.Element {
    const {currentComment} = this.state;
    return (
      <CommentWrapper>
        <CommentLabel>Commentaire</CommentLabel>
        <CommentInput
          value={currentComment}
          onKeyPress={this.handleInputKeyPress}
          onChange={this.handleInputChange}
          type="text"
          placeholder="Entrer un commentaire si besoin"
        />
      </CommentWrapper>
    );
  }
}

const CommentWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const CommentLabel = styled.div`
  flex-shrink: 0;
  margin-right: 16px;
`;

const CommentInput = styled.input`
  flex-grow: 1;
  font-family: ${theme.base.fontFamily};
  font-size: 16px;
  border: none;
  outline: none;
  padding: ${theme.input.padding};
`;
