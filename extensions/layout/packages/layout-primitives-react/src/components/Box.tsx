import React from 'react';
import styles from './Box.module.css';

type SpacingValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
type AlignSelf = 'start' | 'center' | 'end' | 'stretch';

export interface BoxProps {
  children?: React.ReactNode;
  className?: string;

  // Padding props
  p?: SpacingValue;
  px?: SpacingValue;
  py?: SpacingValue;
  pt?: SpacingValue;
  pr?: SpacingValue;
  pb?: SpacingValue;
  pl?: SpacingValue;

  // Margin props
  m?: SpacingValue;
  mx?: SpacingValue;
  my?: SpacingValue;
  mt?: SpacingValue;
  mr?: SpacingValue;
  mb?: SpacingValue;
  ml?: SpacingValue;

  // Align self
  alignSelf?: AlignSelf;
}

export const Box: React.FC<BoxProps> = ({
  children,
  className,
  p,
  px,
  py,
  pt,
  pr,
  pb,
  pl,
  m,
  mx,
  my,
  mt,
  mr,
  mb,
  ml,
  alignSelf,
}) => {
  const classes = [
    styles.box,
    p !== undefined && styles[`p-${p}`],
    px !== undefined && styles[`px-${px}`],
    py !== undefined && styles[`py-${py}`],
    pt !== undefined && styles[`pt-${pt}`],
    pr !== undefined && styles[`pr-${pr}`],
    pb !== undefined && styles[`pb-${pb}`],
    pl !== undefined && styles[`pl-${pl}`],
    m !== undefined && styles[`m-${m}`],
    mx !== undefined && styles[`mx-${mx}`],
    my !== undefined && styles[`my-${my}`],
    mt !== undefined && styles[`mt-${mt}`],
    mr !== undefined && styles[`mr-${mr}`],
    mb !== undefined && styles[`mb-${mb}`],
    ml !== undefined && styles[`ml-${ml}`],
    alignSelf && styles[`align-self-${alignSelf}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children}</div>;
};
