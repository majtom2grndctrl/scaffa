/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Box } from '../components/Box';

describe('Box', () => {
  it('renders children', () => {
    const { getByText } = render(<Box>Test Content</Box>);
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('applies padding classes', () => {
    const { container } = render(<Box p={4}>Content</Box>);
    const box = container.firstChild as HTMLElement;
    expect(box.className).toContain('p-4');
  });

  it('applies padding axis variants', () => {
    const { container } = render(
      <Box px={2} py={3}>
        Content
      </Box>
    );
    const box = container.firstChild as HTMLElement;
    expect(box.className).toContain('px-2');
    expect(box.className).toContain('py-3');
  });

  it('applies padding individual sides', () => {
    const { container } = render(
      <Box pt={1} pr={2} pb={3} pl={4}>
        Content
      </Box>
    );
    const box = container.firstChild as HTMLElement;
    expect(box.className).toContain('pt-1');
    expect(box.className).toContain('pr-2');
    expect(box.className).toContain('pb-3');
    expect(box.className).toContain('pl-4');
  });

  it('applies margin classes', () => {
    const { container } = render(<Box m={8}>Content</Box>);
    const box = container.firstChild as HTMLElement;
    expect(box.className).toContain('m-8');
  });

  it('applies margin axis variants', () => {
    const { container } = render(
      <Box mx={4} my={6}>
        Content
      </Box>
    );
    const box = container.firstChild as HTMLElement;
    expect(box.className).toContain('mx-4');
    expect(box.className).toContain('my-6');
  });

  it('applies alignSelf', () => {
    const { container } = render(<Box alignSelf="center">Content</Box>);
    const box = container.firstChild as HTMLElement;
    expect(box.className).toContain('align-self-center');
  });

  it('accepts custom className', () => {
    const { container } = render(<Box className="custom-class">Content</Box>);
    const box = container.firstChild as HTMLElement;
    expect(box.className).toContain('custom-class');
  });

  it('combines multiple props without breaking layout classes', () => {
    const { container } = render(
      <Box p={4} m={2} alignSelf="start" className="custom">
        Content
      </Box>
    );
    const box = container.firstChild as HTMLElement;
    expect(box.className).toContain('p-4');
    expect(box.className).toContain('m-2');
    expect(box.className).toContain('align-self-start');
    expect(box.className).toContain('custom');
  });
});
