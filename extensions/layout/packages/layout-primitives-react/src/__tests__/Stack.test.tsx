import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Stack } from '../components/Stack';

describe('Stack', () => {
  it('renders children', () => {
    const { getByText } = render(<Stack>Test Content</Stack>);
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('applies gap classes', () => {
    const { container } = render(<Stack gap={4}>Content</Stack>);
    const stack = container.firstChild as HTMLElement;
    expect(stack.className).toContain('gap-4');
  });

  it('applies gap special values', () => {
    const { container } = render(<Stack gap="space-between">Content</Stack>);
    expect((container.firstChild as HTMLElement).className).toContain('gap-space-between');
  });

  it('applies align classes', () => {
    const { container } = render(<Stack align="center">Content</Stack>);
    const stack = container.firstChild as HTMLElement;
    expect(stack.className).toContain('align-center');
  });

  it('applies justify classes', () => {
    const { container } = render(<Stack justify="between">Content</Stack>);
    const stack = container.firstChild as HTMLElement;
    expect(stack.className).toContain('justify-between');
  });

  it('applies wrap classes', () => {
    const { container } = render(<Stack wrap="wrap">Content</Stack>);
    const stack = container.firstChild as HTMLElement;
    expect(stack.className).toContain('wrap-wrap');
  });

  it('applies direction classes', () => {
    const { container } = render(<Stack direction="reverse">Content</Stack>);
    const stack = container.firstChild as HTMLElement;
    expect(stack.className).toContain('direction-reverse');
  });

  it('applies padding and margin', () => {
    const { container } = render(
      <Stack p={4} m={2}>
        Content
      </Stack>
    );
    const stack = container.firstChild as HTMLElement;
    expect(stack.className).toContain('p-4');
    expect(stack.className).toContain('m-2');
  });

  it('accepts custom className', () => {
    const { container } = render(<Stack className="custom-class">Content</Stack>);
    const stack = container.firstChild as HTMLElement;
    expect(stack.className).toContain('custom-class');
  });

  it('combines all layout props correctly', () => {
    const { container } = render(
      <Stack gap={3} align="center" justify="between" wrap="nowrap" direction="normal" p={4} m={2}>
        Content
      </Stack>
    );
    const stack = container.firstChild as HTMLElement;
    expect(stack.className).toContain('gap-3');
    expect(stack.className).toContain('align-center');
    expect(stack.className).toContain('justify-between');
    expect(stack.className).toContain('wrap-nowrap');
    expect(stack.className).toContain('direction-normal');
    expect(stack.className).toContain('p-4');
    expect(stack.className).toContain('m-2');
  });
});
