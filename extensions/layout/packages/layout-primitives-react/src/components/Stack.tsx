import React from 'react';
import styles from './Stack.module.css';

type SpacingValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
type GapValue = SpacingValue | 'space-between';
type Align = 'start' | 'center' | 'end' | 'stretch';
type Justify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
type Wrap = 'nowrap' | 'wrap' | 'wrap-reverse';
type Direction = 'normal' | 'reverse';

export interface StackProps {
  children?: React.ReactNode;
  className?: string;

  // Layout props
  gap?: GapValue;
  align?: Align;
  justify?: Justify;
  wrap?: Wrap;
  direction?: Direction;

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
}

export const Stack: React.FC<StackProps> = ({
  children,
  className,
  gap,
  align,
  justify,
  wrap,
  direction,
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
}) => {
  const classes = [
    styles.stack,
    gap !== undefined && styles[`gap-${gap}`],
    align && styles[`align-${align}`],
    justify && styles[`justify-${justify}`],
    wrap && styles[`wrap-${wrap}`],
    direction && styles[`direction-${direction}`],
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
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children}</div>;
};
