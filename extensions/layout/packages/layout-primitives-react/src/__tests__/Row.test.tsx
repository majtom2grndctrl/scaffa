import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Row } from '../components/Row';

describe('Row', () => {
  it('renders children', () => {
    const { getByText } = render(<Row>Test Content</Row>);
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('applies gap classes', () => {
    const { container } = render(<Row gap={4}>Content</Row>);
    const row = container.firstChild as HTMLElement;
    expect(row.className).toContain('gap-4');
  });

  it('applies gap special values', () => {
    const { container } = render(<Row gap="space-between">Content</Row>);
    expect((container.firstChild as HTMLElement).className).toContain('gap-space-between');
  });

  it('applies align classes', () => {
    const { container } = render(<Row align="center">Content</Row>);
    const row = container.firstChild as HTMLElement;
    expect(row.className).toContain('align-center');
  });

  it('applies justify classes', () => {
    const { container } = render(<Row justify="between">Content</Row>);
    const row = container.firstChild as HTMLElement;
    expect(row.className).toContain('justify-between');
  });

  it('applies wrap classes', () => {
    const { container } = render(<Row wrap="wrap">Content</Row>);
    const row = container.firstChild as HTMLElement;
    expect(row.className).toContain('wrap-wrap');
  });

  it('applies direction classes', () => {
    const { container } = render(<Row direction="reverse">Content</Row>);
    const row = container.firstChild as HTMLElement;
    expect(row.className).toContain('direction-reverse');
  });

  it('applies padding and margin', () => {
    const { container } = render(
      <Row p={4} m={2}>
        Content
      </Row>
    );
    const row = container.firstChild as HTMLElement;
    expect(row.className).toContain('p-4');
    expect(row.className).toContain('m-2');
  });

  it('accepts custom className', () => {
    const { container } = render(<Row className="custom-class">Content</Row>);
    const row = container.firstChild as HTMLElement;
    expect(row.className).toContain('custom-class');
  });

  it('combines all layout props correctly', () => {
    const { container } = render(
      <Row gap={3} align="center" justify="between" wrap="nowrap" direction="normal" p={4} m={2}>
        Content
      </Row>
    );
    const row = container.firstChild as HTMLElement;
    expect(row.className).toContain('gap-3');
    expect(row.className).toContain('align-center');
    expect(row.className).toContain('justify-between');
    expect(row.className).toContain('wrap-nowrap');
    expect(row.className).toContain('direction-normal');
    expect(row.className).toContain('p-4');
    expect(row.className).toContain('m-2');
  });
});
