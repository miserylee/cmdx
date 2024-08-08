import { ANSI, paint } from '../src';
import { padText, purify, textWidth } from '../src/processText';

describe('processText', () => {
  describe('textWidth', () => {
    it('should work as expected when text is total latin chars', () => {
      expect(textWidth('foobar')).toBe(6);
    });
    it('should work as expected when text contains chinese chars', () => {
      expect(textWidth('foo你好bar')).toBe(10);
    });
  });
  describe('padText', () => {
    it.each<[string, number | string, string]>([
      ['foobar', 6, 'foobar'],
      ['foobar', 10, '    foobar'],
      ['foobar', 4, 'foo…'],
      ['foobar', '$10$', '$$foobar$$'],
      ['foobar', '$4^', 'foo…'],
      ['foobar', '10^', 'foobar^^^^'],
      ['foobar', '10', '    foobar'],
      ['中文', '10', '      中文'],
      ['中文中文中文', '10', '中文中文……'],
      ['foobar', '中11文', '中foobar文 '],
      ['foobar', 'aaa', 'foobar'],
    ])(`should pad text(%s) with format %s`, (text, format, expectedText) => {
      expect(padText(text, format)).toBe(expectedText);
    });
  });
  describe('purify', () => {
    it('should remove all control characters as expected', () => {
      expect(purify(paint(ANSI.blue)('foobar'))).toBe('foobar');
      expect(purify(`${paint(ANSI.blue)('foobar')}\n${paint(ANSI.italic)('hello')} world`)).toBe(
        'foobar\nhello world'
      );
    });
  });
});
