import { printTable } from '../src';

printTable({
  title: 'This is the title',
  heads: ['Column 1', 'Column 2', 'Column 3'],
  content: [
    ['hello', 'world', 'haha'],
    ['你好', '世界', '这一句话很长很长很长很长很长很长很长很长'],
  ],
  colWidths: [10, 10, 20],
});
