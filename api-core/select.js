// 抽取：使用构建时生成的长度索引，等概率选出匹配的句子。
// 先按分类汇总候选，两种模式共用同一份候选表，只是抽取方式不同。
// mode=weighted（默认）：全库等概率，即大分类更容易被抽中；
// mode=category（别名 balanced）：先在符合条件的分类中等概率抽一个
// 分类，再在该分类内等概率抽一句，小分类和大分类机会均等。
// 只指定一个分类时两种模式结果相同。
// 返回 { key, indexes, length, selected }，无符合条件的句子时返回 null。
export function selectSentence(sentenceIndex, { categoryKey, balancedMode, minLength, maxLength }) {
    const keys = categoryKey ? [categoryKey] : Object.keys(sentenceIndex);
    const perCategory = [];
    let total = 0;
    for (const key of keys) {
        if (!Object.prototype.hasOwnProperty.call(sentenceIndex, key)) {continue;}
        const buckets = [];
        let categoryTotal = 0;
        for (const [length, indexes] of Object.entries(sentenceIndex[key])) {
            if (Number(length) < minLength || Number(length) > maxLength) {continue;}
            buckets.push({ length: Number(length), indexes });
            categoryTotal += indexes.length;
        }
        if (categoryTotal > 0) {
            perCategory.push({ key, buckets, total: categoryTotal });
            total += categoryTotal;
        }
    }
    if (!total) {return null;}
    let chosen;
    let chosenLength;
    let selected;
    if (balancedMode && perCategory.length > 1) {
        const category = perCategory[Math.floor(Math.random() * perCategory.length)];
        selected = Math.floor(Math.random() * category.total);
        for (const bucket of category.buckets) {
            if (selected < bucket.indexes.length) {chosen = { key: category.key, indexes: bucket.indexes }; chosenLength = bucket.length; break;}
            selected -= bucket.indexes.length;
        }
    } else {
        selected = Math.floor(Math.random() * total);
        for (const category of perCategory) {
            for (const bucket of category.buckets) {
                if (selected < bucket.indexes.length) {chosen = { key: category.key, indexes: bucket.indexes }; chosenLength = bucket.length; break;}
                selected -= bucket.indexes.length;
            }
            if (chosen) {break;}
        }
    }
    return { key: chosen.key, indexes: chosen.indexes, length: chosenLength, selected };
}
