import React from 'react';
import styled from 'styled-components';

import {Textarea} from '@root/components/core/textarea';
import {Palette, Colors, theme} from '@root/theme';

interface Props {
  padding: JSX.Element;
  comment: string;
  width: number;
  isPrinting: boolean;
  onChange?(event: React.ChangeEvent<HTMLTextAreaElement>): void;
}

export class PlanProdComment extends React.Component<Props> {
  public static displayName = 'PlanProdComment';

  public render(): JSX.Element {
    const {padding, comment, width, onChange, isPrinting} = this.props;

    if (isPrinting) {
      if (comment.length === 0) {
        return <React.Fragment />;
      } else {
        return (
          <React.Fragment>
            {padding}
            <CommentBlock style={{width}}>{comment}</CommentBlock>
          </React.Fragment>
        );
      }
    }
    return (
      <React.Fragment>
        {padding}
        <Textarea
          style={{
            width,
            height: 72,
            fontSize: 20,
            resize: 'none',
          }}
          placeholder="Commentaires"
          onChange={onChange}
          value={comment}
        />
      </React.Fragment>
    );
  }
}

const CommentBlock = styled.pre`
  font-family: ${theme.base.fontFamily};
  margin: 0;
  padding: 16px;
  font-size: 20px;
  border: solid 3px ${Colors.SecondaryDark};
  background-color: ${Palette.White};
  box-sizing: border-box;
`;
