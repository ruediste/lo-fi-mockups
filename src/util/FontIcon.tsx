import { css } from "@emotion/react";

export function FontIcon({ nr }: { nr: number }) {
  //   const nr = 0xf102;
  return (
    <i
      css={css`
        display: inline-block;
        font-family: bootstrap-icons !important;
        font-style: normal;
        font-weight: normal !important;
        font-variant: normal;
        text-transform: none;
        line-height: 1;
        vertical-align: -0.125em;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      `}
      dangerouslySetInnerHTML={{ __html: `&#${nr}` }}
    ></i>
  );
}
