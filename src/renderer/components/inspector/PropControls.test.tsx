/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlRenderer, JsonControl } from './PropControls';
import type { ControlDefinition } from '../../../shared/index.js';

describe('PropControls - Scaffa-specific behavior', () => {
  describe('JsonControl - validation logic', () => {
    it('should parse valid JSON and call onChange', () => {
      const onChange = vi.fn();

      render(<JsonControl value={{}} onChange={onChange} control={{ kind: 'json' }} />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      const validJson = '{"name":"test","value":123}';
      fireEvent.change(textarea, { target: { value: validJson } });

      expect(onChange).toHaveBeenCalledWith({ name: 'test', value: 123 });
    });

    it('should not call onChange for invalid JSON', () => {
      const onChange = vi.fn();

      render(<JsonControl value={{}} onChange={onChange} control={{ kind: 'json' }} />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      const invalidJson = '{name: test}'; // Missing quotes
      fireEvent.change(textarea, { target: { value: invalidJson } });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('should handle complex nested JSON structures', () => {
      const onChange = vi.fn();
      const complexValue = {
        config: {
          theme: 'dark',
          options: [1, 2, 3],
        },
      };

      render(<JsonControl value={complexValue} onChange={onChange} control={{ kind: 'json' }} />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toContain('"theme"');
      expect(textarea.value).toContain('"dark"');
    });
  });

  describe('ControlRenderer - dispatching logic', () => {
    it('should dispatch to StringControl for string controls', () => {
      const onChange = vi.fn();
      render(<ControlRenderer value="" onChange={onChange} control={{ kind: 'string', placeholder: 'Test' }} />);
      expect(screen.getByPlaceholderText('Test')).toBeInTheDocument();
    });

    it('should dispatch to NumberControl for number controls', () => {
      const onChange = vi.fn();
      render(<ControlRenderer value={0} onChange={onChange} control={{ kind: 'number' }} />);
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('should dispatch to JsonControl for json controls', () => {
      const onChange = vi.fn();
      render(<ControlRenderer value={{}} onChange={onChange} control={{ kind: 'json' }} />);
      expect(screen.getByText(/Enter valid JSON/)).toBeInTheDocument();
    });

    it('should show error for unknown control types', () => {
      const onChange = vi.fn();
      const invalidControl = { kind: 'invalid-type' } as any;

      render(<ControlRenderer value={undefined} onChange={onChange} control={invalidControl} />);

      expect(screen.getByText('Unknown control type')).toBeInTheDocument();
    });
  });
});
