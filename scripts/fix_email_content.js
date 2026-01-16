
const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'client/src/pages/EmailContent.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Identify the garbage block
// Starts with }} then <DialogContent...
// Ends with </Dialog> then className=...

const startMarker = '                          <DialogContent className="sm:max-w-[425px]">';
const endMarker = '                    </Dialog>';
const lookAhead = '                  className="text-red-500 hover:text-red-700 hover:bg-red-50"';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex);
const nextValidIndex = content.indexOf(lookAhead, endIndex);

if (startIndex !== -1 && endIndex !== -1 && nextValidIndex !== -1) {
    console.log(`Found garbage block from index ${startIndex} to ${endIndex}`);

    // Check if the end marker is actually followed by the lookAhead (ignoring whitespace/newlines)
    // Actually, I can just slice it out.
    // I want to keep the content BEFORE startMarker.
    // And keep the content STARTING AT lookAhead (or checks if lookAhead is close)

    // The previous replace removed the duplicate tail, so </Dialog> is immediately followed by className=... (maybe with newline)

    // Let's locate the exact substring to remove.
    // It is everything from startMarker to the end of endMarker line?

    // Let's refine.
    // We want to remove from `startMarker` up to (and including) `endMarker` + newlines.

    // Let's substring the file to inspect.
    const garbage = content.substring(startIndex, endIndex + endMarker.length);
    console.log("Garbage sample:", garbage.substring(0, 50) + "..." + garbage.substring(garbage.length - 20));

    const newContent = content.slice(0, startIndex) + content.slice(endIndex + endMarker.length);

    // We might leave extra newlines, but better than garbage code.
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log("File fixed.");
} else {
    console.log("Garbage block not found.");
    console.log("Start:", startIndex);
    console.log("End:", endIndex);
    console.log("Next:", nextValidIndex);
}
