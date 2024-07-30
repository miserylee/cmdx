export function textWidth(text: string): number {
  return text.length + (text.match(/[\u4e00-\u9fa5]/g)?.length ?? 0);
}

/**
 * 补充文本到目标长度
 * @param text
 * @param format
 * 如果传入了数字，则使用空格补充到目标长度，如果文本过长，则截断到目标长度
 * 如果传入了字符串，需要满足下面的格式来提供必要的信息
 * X5Y
 * 其中 X 和 Y 为补充文本时使用的占位字符，中间的数字代表最终补全或截断到的长度
 * X 或 Y 可以不提供，不提供时，则不进行对应侧的补全
 * 如果 X 和 Y 都提供时，根据需要补全的长度平均分配长度
 * 示例：
 * padText('foobar', '$10$') // $$foobar$$
 * padText('foobar', '$4^') // foob (文本超过目标长度，截断)
 * padText('foobar', '10^') // foobar^^^^
 * padText('foobar', '10') // ____foobar (实际是空格，而不是下划线)
 */
export function padText(text: string, format: number | string): string {
  const parsedFormat = /^(\D?)(\d+)(\D?)$/.exec(String(format));
  if (!parsedFormat) {
    // TODO: print debug error
    return text;
  }
  const [, _prefix, lenStr, suffix] = parsedFormat;
  let prefix = _prefix;
  if (!_prefix && !suffix) {
    // 如果没有提供任何占位符，则往左侧添加空格
    prefix = ' ';
  }
  const totalLen = Number(lenStr);
  // 如果原始文本已经是目标长度，直接返回
  if (textWidth(text) === totalLen) {
    return text;
  }
  // 先确保原始文本不超过最大长度，从尾部开始截断
  let trimmed = false;
  while (textWidth(text) > totalLen) {
    text = text.slice(0, -1);
    trimmed = true;
  }
  // 如果发生过截断，则给尾部补充省略号，并返回结果
  if (trimmed) {
    if (textWidth(text) === totalLen) {
      // 尾部留空间来放省略号
      text = text.slice(0, -1);
    }
    while (textWidth(text) < totalLen) {
      text = text + '…';
    }
    return text;
  }
  // 循环补充占位字符到目标长度，优先补充左侧
  let side = 'prefix';
  while (textWidth(text) < totalLen) {
    if (side === 'prefix') {
      text = prefix + text;
      side = 'suffix';
    } else {
      text = text + suffix;
      side = 'prefix';
    }
  }
  if (textWidth(text) === totalLen) {
    return text;
  }
  // 追加了占位后超出了目标长度时，移除头部字符并补尾空格
  text = text.slice(1);
  while (textWidth(text) < totalLen) {
    text = text + ' ';
  }
  return text;
}
