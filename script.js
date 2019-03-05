const path = process.argv[2];
const name = path.split('/')[path.split('/').length - 1].split('.')[0];
const fs = require('fs');
const now = require('performance-now');

const readContent = () => {
    return fs.readFileSync(path, 'utf8');
};

const writeToFile = (rows) => {
    fs.writeFileSync('./' + name + '.out', rows.join('\n'), 'utf8');
};

const parseInput = (contentToParse) => {
    const start = now();
    const lines = contentToParse.split('\n');
    if (lines[lines.length - 1] === '')
        lines.splice(lines.length - 1, 1);
    const photosNumber = lines.splice(0, 1);
    const horizontalPics = [];
    const verticalPics = [];
    for (let i = 0; i < photosNumber; i++) {
        const line = lines[i].split(' ');
        const id = i;
        const orientation = line[0];
        const tagsNumber = line[1];
        const tags = [];
        for (let j = 0; j < tagsNumber; j++) {
            tags.push(line[2 + j]);
        }

        if (orientation === 'H') {
            horizontalPics.push({ id, orientation, tagsNumber, tags: new Set(tags) });
        } else {
            verticalPics.push({ id, orientation, tagsNumber, tags });
        }
    }
    const end = now();
    console.log(`parseInput took ${(end - start).toFixed(3)} ms`);
    return { horizontalPics, verticalPics };
};

const parseOutput = (results) => {
    const start = now();

    const number = result.length;
    const rest = results.map(item => {
        if (item.orientation === '2V')
            return `${item.id[0]} ${item.id[1]}`;
        else
            return item.id;
    });

    const end = now();
    console.log(`parseOutput took ${(end - start).toFixed(3)} ms`);
    return [number].concat(rest);
};

const mergeVerticalPics = (verticalPics) => {
    const start = now();
    const mergedSlides = [];
    verticalPics = verticalPics.sort((a, b) => a.tagsNumber - b.tagsNumber);
    while (verticalPics.length > 1) {
        let currentPic = verticalPics.splice(0, 1)[0];
        let bestMatchIndex = undefined;
        let bestMatchTags = new Set([]);
        for (let i = 0; i < verticalPics.length; i++) {
            const resultingTags = new Set(verticalPics[i].tags.concat(currentPic.tags));
            if (resultingTags.size > bestMatchTags.size) {
                bestMatchTags = resultingTags;
                bestMatchIndex = i;
            }
        }
        const newSlide = {
            id: [currentPic.id, verticalPics.splice(bestMatchIndex, 1)[0].id],
            orientation: '2V',
            tagsNumber: bestMatchTags.size,
            tags: bestMatchTags
        };
        mergedSlides.push(newSlide);
    }

    const end = now();
    console.log(`mergeVerticalPics took ${(end - start).toFixed(3)} ms`);
    return mergedSlides;
};

const calculateMatches = (slide1, slide2) => {
    let matches = 0;
    slide1.tagsNumber < slide2.tagsNumber
        ? slide1.tags.forEach(tag => { if (slide2.tags.has(tag)) matches++ })
        : slide2.tags.forEach(tag => { if (slide1.tags.has(tag)) matches++ })
    return matches;
};

const getBestMatch = (initialSlide, remaining) => {
    if (remaining.length === 1)
        return remaining.splice(0, 1)[0];
    const maxPossible = Math.floor(initialSlide.tags.size / 2);
    let max = { slide: undefined, count: 0 };
    for (let j = 0; j < remaining.length && maxPossible !== max.count; j++) {
        const matches = calculateMatches(initialSlide, remaining[j]);
        const s1only = initialSlide.tagsNumber - matches;
        const s2only = remaining[j].tagsNumber - matches;
        const count = Math.min(s1only, s2only, matches);
        if (count > max.count) {
            max = { slide: j, count };
        }
    }
    return remaining.splice(max.slide, 1)[0];
};

const getSlideshow = (horizontalPics, verticalPics) => {
    const start = now();
    const doubleVerticalPics = mergeVerticalPics(verticalPics);
    let allSlides = horizontalPics.concat(doubleVerticalPics);
    allSlides = allSlides.sort((a, b) => a.tagsNumber - b.tagsNumber);
    const result = allSlides.splice(0, 1);
    while (allSlides.length > 0) {
        const theSlide = getBestMatch(result[result.length - 1], allSlides);
        result.push(theSlide);
    }
    const end = now();
    console.log(`getSlideshow took ${(end - start).toFixed(3)} ms`);
    return result;
};

const content = readContent();
const { horizontalPics, verticalPics } = parseInput(content);
const result = getSlideshow(horizontalPics, verticalPics);
const parsedOutput = parseOutput(result);

writeToFile(parsedOutput);