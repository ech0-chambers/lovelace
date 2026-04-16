function mod(n, m) {
    return ((n % m) + m) % m;
}

const TokenType = {
    YarnOver: 0,
    Knit: 1,
    KnitBack: 2,
    Knit2Tog: 3,
    SSK: 4,
    Sl1Knit2TogPSSO: 5,
    Sl2Knit1PSSO: 6,
    Knit3Tog: 7,
    RepStart: 8,
    RepEnd: 9,
    InnerRepStart: 10,
    InnerRepEnd: 11,
    LastRepDiff: 12,
    Instead: 13,
    Separator: 14,
    RowNum: 15,
};

const _TokenType = {
    0: "YarnOver",
    1: "Knit",
    2: "KnitBack",
    3: "Knit2Tog",
    4: "SSK",
    5: "Sl1Knit2TogPSSO",
    6: "Sl2Knit1PSSO",
    7: "Knit3Tog",
    8: "RepStart",
    9: "RepEnd",
    10: "InnerRepStart",
    11: "InnerRepEnd",
    12: "LastRepDiff",
    13: "Instead",
    14: "Separator",
    15: "RowNum",
};

class Token {
    constructor(type, span = 1) {
        this.type = type;
        this.span = span;
    }
}

const Direction = {
    Left: 1,
    Right: -1
}

class Transfer {
    constructor(start, end, inverted = false) {
        this.start = start;
        this.end = end;
        this.transfer_direction = this.start > this.end ? Direction.Left : Direction.Right;
        this.inverted = inverted;
    }

    select(carriage_direction) {
        if (this.inverted) {
            if (this.transfer_direction == carriage_direction) {
                return this.end;
            }
            return null;
        }
        if (this.transfer_direction != carriage_direction) {
            return this.end + this.transfer_direction; // end + 1 if left, end - 1 if right
        }
        return null;
    }

    step(carriage_direction) {
        if (this.inverted) {
            this.inverted = false;
            return true;
        }
        this.end += this.transfer_direction;
        return this.start != this.end;
    }
}

const SELECT_NONE = "nothing";

class DoubleTransfer {
    constructor(left, centre, right, decrease) {
        this.left = left;
        this.right = right;
        this.centre_left = centre;
        this.centre_right = centre;
        this.decrease = decrease;
        this.decrease_steps = null;

        if (this.decrease == TokenType.Sl1Knit2TogPSSO) {
            this.decrease_steps = {};
            this.decrease_steps[Direction.Left] = [this.centre_left];
            this.decrease_steps[Direction.Right] = [SELECT_NONE, SELECT_NONE];
        }
        if (this.decrease == TokenType.Knit3Tog) {
            this.decrease_steps = {};
            this.decrease_steps[Direction.Left] = [this.centre_left];
            this.decrease_steps[Direction.Right] = [SELECT_NONE];
        }
    }

    select(carriage_direction) {
        if (this.decrease_steps !== null) {
            if (this.decrease_steps[carriage_direction].length > 0) {
                return this.decrease_steps[carriage_direction][0];
            }
            return null;
        }
        if (carriage_direction == Direction.Left) {
            if (this.centre_left > this.left) {
                return this.centre_left - 1;
            }
            return null;
        }
        if (this.centre_right < this.right) {
            return this.centre_right + 1;
        }
        return null;
    }

    step(carriage_direction) {
        if (this.decrease_steps !== null) {
            if (this.decrease_steps[carriage_direction].length > 0) {
                this.decrease_steps[carriage_direction].shift();
            }
            if (this.decrease_steps[Direction.Left].length == 0 && this.decrease_steps[Direction.Right].length == 0) {
                this.decrease_steps = null;
            }
            return true;
        }
        if (carriage_direction == Direction.Left && this.centre_left > this.left) {
            this.centre_left -= 1;
        } else if (carriage_direction == Direction.Right && this.centre_right < this.right) {
            this.centre_right += 1;
        }
        return (this.centre_right < this.right || this.centre_left > this.left);
    }
}

const _NON_PRINTED = [
    TokenType.RepStart,
    TokenType.RepEnd,
    TokenType.Instead,
    TokenType.Separator,
    TokenType.RowNum,
];
const _DECREASES = [
    TokenType.Knit2Tog,
    TokenType.SSK,
];
const _LEFT_DECREASES = [TokenType.SSK,];
const _RIGHT_DECREASES = [TokenType.Knit2Tog,];
const _DOUBLE_DECREASES = [
    TokenType.Sl1Knit2TogPSSO,
    TokenType.Sl2Knit1PSSO,
    TokenType.Knit3Tog,
];
const _INCREASES = [TokenType.YarnOver,];

const _TOKEN_PATTERNS = [
    [TokenType.RowNum, /^r(?:ow)? (?<row>\d+)\s*[,-\u2014]?\s*/],
    [TokenType.Separator, /^(\s*[,;.]\s*|\s+)/],
    [
        TokenType.Sl1Knit2TogPSSO,
        /^sl(?:ip)?\s?1?\s?[,-\u2014]?\s?k(?:nit)?\s?2\s?[,-\u2014]?tog(?:ether)?\s?[,-\u2014]?\s?(?:psso|pass sl(?:ipped)? st(?:ich)? over)/,
    ],
    [
        TokenType.Sl2Knit1PSSO,
        /^sl(?:ip)?\s?(?:2|two)\s?[,-\u2014]?\s?k(?:nit)?\s?1?\s?[,-\u2014]?\s?(?:p2?sso|pass (?:2|two|both)?\s?sl(?:ipped)? st(?:itch(?:es)?)? over)/,
    ],
    [TokenType.Knit3Tog, /^k(?:nit)?\s?(?:3|three)\s?[,-\u2014]?\s?tog(?:ether)?/],
    [TokenType.YarnOver, /^y(?:arn)?\s?o(?:ver)?\s?(?<span>\d+)?/],
    [TokenType.KnitBack, /^k(?:nit)?(?<span>\d+)\s?[,-\u2014]?\s?b/],
    [TokenType.Knit2Tog, /^k(?:nit)?\s?(?:2|two)\s?[,-\u2014]?\s?tog(?:ether)?/],
    [TokenType.SSK, /^s(?:lip)?\s?[,-\u2014]?\s?s(?:lip)?\s?[,-\u2014]?\s?k(?:nit)?/],
    [TokenType.RepEnd, /^rep(?:eat)?\sfrom\s?\*\.?/],
    [TokenType.RepStart, /^\*\s*/],
    [TokenType.InnerRepEnd, /^\)\s*(?<span>\w+(\s\w+)?)/],
    [TokenType.InnerRepStart, /^(?:rep(?:eat)?\s)?\(/],
    [TokenType.Knit, /^k(?:nit)?\s?(?<span>\d+)/],
    [TokenType.LastRepDiff, /^end\slast\srep(eat)?\s?/],
    [TokenType.Instead, /^\s?instead\sof.*?$/],
]

const _SYMBOLS_MAP = {
    o: TokenType.YarnOver,
    O: TokenType.YarnOver,
    0: TokenType.YarnOver,
    " ": TokenType.Knit,
    ".": TokenType.Knit,
    "-": TokenType.Knit,
    "/": TokenType.Knit2Tog,
    "\\": TokenType.SSK,
    "^": TokenType.Sl2Knit1PSSO,
    "x": TokenType.Sl2Knit1PSSO,
    "X": TokenType.Sl2Knit1PSSO,
}

// ========================================================================================================================
// Source - https://stackoverflow.com/a/175787
// Posted by Dan, modified by community. See post 'Timeline' for change history
// Retrieved 2026-04-10, License - CC BY-SA 4.0

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}
// ========================================================================================================================

class PatternError extends Error {
    constructor(message, type, trace, extras = {}) {
        super(message);
        this.trace = [trace];
        this.type = type;
        this.extras = extras;
    }

    add_trace(trace) {
        this.trace.push(trace); // mostly for debugging
    }
}

function ensure_number(str) {
    if (str == undefined) {
        return 1;
    }
    if (typeof str == "number") {
        return str;
    }
    if (isNumeric(str)) {
        return parseFloat(str);
    }

    let number_map = {
        "twice": 2,
        "thrice": 3,
        "two times": 2,
        "three times": 3,
        "four times": 4,
        "five times": 5,
        "six times": 6,
        "seven times": 7,
        "eight times": 8,
        "nine times": 9,
        "2 times": 2,
        "3 times": 3,
        "4 times": 4,
        "5 times": 5,
        "6 times": 6,
        "7 times": 7,
        "8 times": 8,
        "9 times": 9,
    };

    if (number_map[str] !== undefined) {
        return number_map[str];
    }
    throw new PatternError(`Could not convert "${str}" to an integer.`, "highlight_word", "ensure_number");
}

class Row {
    constructor(instructions) {
        this.instructions = instructions;
        this._expanded = null;
        this._transfers = null;
        this._stitch_count = null;
    }

    get stitch_count() {
        if (this._stitch_count !== null) {
            return this._stitch_count;
        }
        this._stitch_count = this.expanded.length;
        return this._stitch_count;
    }

    get expanded() {
        if (this._expanded !== null) {
            return this._expanded;
        }
        if (this.instructions.length == 0) {
            throw new PatternError("Could not expand tokens in Row: Row contains no tokens.", "highlight_row", "Row.expanded");
        }

        let row = [...this.instructions];
        let instructions = [];
        let repeat = [];
        while (row.length > 0) {
            let i = row.shift();

            if (i.type == TokenType.InnerRepStart) {
                repeat = [];
                i = row.shift();
                while (i.type != TokenType.InnerRepEnd) {
                    if (i.type != TokenType.Separator) {
                        repeat.push(i);
                    }
                    i = row.shift();
                }
                for (let r = 0; r < i.span; r++) {
                    instructions = instructions.concat(repeat);
                }
                continue;
            }
            if (_NON_PRINTED.includes(i.type)) {
                continue;
            }
            if (i.type == TokenType.LastRepDiff) {
                i = row.shift();
                instructions.pop();
            }
            instructions.push(i);
        }
        this._expanded = [];
        instructions.forEach((i) => { this._expanded = this._expanded.concat(Array(i.span).fill(i.type)); });
        return this._expanded;
    }

    static from_string(str) {
        str = str.trim().toLowerCase();
        let instructions = [];
        let idx = 0;
        while (idx < str.length) {
            let found = false;
            for (let ti = 0; ti < _TOKEN_PATTERNS.length; ti++) {
                let t = _TOKEN_PATTERNS[ti][0];
                let p = _TOKEN_PATTERNS[ti][1];
                let m = p.exec(str.slice(idx));
                if (m != null) {
                    idx += m[0].length;
                    let s;
                    try {
                        s = m.groups == undefined ? 1 : ensure_number(m.groups.span);
                    } catch (e) {
                        if (e instanceof PatternError) {
                            e.add_trace("Row.from_string")
                            e.extras.idx = idx - m.groups.span.length;
                            e.extras.idx_end = idx;
                        }
                        throw e;
                    }
                    instructions.push(new Token(t, s));
                    found = true;
                    break;
                }
            }
            if (!found) {
                throw new PatternError(`Could not match instruction at index ${idx}.`, "highlight_start", "Row.from_string()", { idx: idx });
            }
        }
        return new Row(instructions);
    }

    static from_chart(str) {
        let instructions = [];
        for (let i = 0; i < str.length; i++) {
            instructions.push(new Token(_SYMBOLS_MAP[str[i]], 1));
        }
        return new Row(instructions);
    }

    to_chart_string() {
        let out = [];
        this.expanded.forEach((inst) => {
            if (_INCREASES.includes(inst)) {
                out.push("o");
            } else if (_LEFT_DECREASES.includes(inst)) {
                out.push("\\");
            } else if (_RIGHT_DECREASES.includes(inst)) {
                out.push("/");
            } else if (_DOUBLE_DECREASES.includes(inst)) {
                out.push("^");
            } else {
                out.push(".");
            }
        });
        return out.join("");
    }


    to_transfers() {
        // transfers *need* to be reset
        // if (this._transfers != null) {
        //     return this._transfers;
        // }
        this._transfers = [];
        let stack = [];

        /* {
                type: "increase",
                instruction: TokenType.YarnOver,
                idx: 4
            }
            {
                type: "double_decrease",
                instruction: TokenType.Sl1K2TogPSSO,
                idx: 5
                ?left_idx: 2  <-- only present if we've already found an increase
            }
        */

        for (let idx = 0; idx < this.expanded.length; idx++) {
            let inst = this.expanded[idx];
            if (_INCREASES.includes(inst)) {
                if (stack.length > 0 && stack[stack.length - 1].type == "decrease") {
                    // We've closed a transfer
                    let inc = stack.pop();
                    this._transfers.push(new Transfer(
                        idx,
                        inc.idx,
                        _LEFT_DECREASES.includes(inc.instruction)
                    ));
                    continue;
                }
                // We might be closing a double decrease
                if (
                    stack.length > 0
                    && stack[stack.length - 1].type == "double_decrease"
                    && stack[stack.length - 1].left_idx != undefined
                ) {
                    let inc = stack.pop();
                    this._transfers.push(new DoubleTransfer(
                        inc.left_idx,
                        inc.idx,
                        idx,
                        inc.instruction
                    ));
                    continue;
                }
                stack.push({
                    type: "increase",
                    instruction: inst,
                    idx: idx
                });
                continue;
            } else if (_DECREASES.includes(inst)) {
                if (stack.length > 0 && stack[stack.length - 1].type == "increase") {
                    let dec = stack.pop();
                    this._transfers.push(new Transfer(
                        dec.idx,
                        idx,
                        _RIGHT_DECREASES.includes(inst)
                    ));
                    continue;
                }
                stack.push({
                    type: "decrease",
                    instruction: inst,
                    idx: idx
                });
            } else if (_DOUBLE_DECREASES.includes(inst)) {
                if (stack.length > 0 && stack[stack.length - 1].type == "increase") {
                    let dec = stack.pop();
                    stack.push({
                        type: "double_decrease",
                        instruction: inst,
                        idx: idx,
                        left_idx: dec.idx
                    });
                    continue;
                }
                stack.push({
                    type: "double_decrease",
                    instruction: inst,
                    idx: idx
                    // no left_idx yet
                });
            }
        }
        if (stack.length > 0) {
            // we can reach this state in two ways:
            //   1) there are not the same number of decreases and increases in this row
            //   2) we started or ended with a double decrease, with the corresponding increase on the other end
            if (
                stack.length == 3
                && stack[0].type == "double_decrease"
                && stack[1].type == "increase"
                && stack[2].type == "increase"
            ) {
                // We have (^, o, o)
                this._transfers.append(new DoubleTransfer(
                    stack[2].idx - this.stitch_count,
                    stack[1].idx,
                    stack[0].idx,
                    stack[0].instruction
                ));
            } else if (
                stack.length == 2
                && stack[1].left_idx != undefined
                && stack[0].type == "increase"
            ) {
                // We have (o, o, ^), which is in the stack as [o, [^, o]]
                this._transfers.push(new DoubleTransfer(
                    stack[1].left_idx,
                    this.stitch_count + stack[0].idx,
                    stack[1].idx,
                    stack[1].instruction
                ));
            } else {
                // Reached the end of the row with mismatched increases/decreases.`)
                throw new PatternError("Reached the end of the row with mismatched increases/decreases.", "highlight_row", "Row.to_transfers");
            }
        }
        // Now deal with any transfers which wrap between adjacent repeats
        for (let i = 0; i < this._transfers.length; i++) {
            let transfer = this._transfers[i];
            if (transfer instanceof DoubleTransfer) {
                // It's not possible for a double transfer to need unwrapping as it would have been caught when the stack had remaining elements
                continue;
            }
            if (Math.abs(transfer.end - transfer.start) > this.stitch_count / 2) {
                let new_transfer;
                if (transfer.start > transfer.end) {
                    new_transfer = new Transfer(
                        transfer.start,
                        transfer.enf + this.stitch_count,
                        !transfer.inverted
                    );
                } else {
                    new_transfer = new Transfer(
                        transfer.start,
                        transfer.end - this.stitch_count,
                        !transfer.inverted
                    );
                }
                this._transfers[i] = new_transfer;
            }
        }
        return this._transfers;
    }

    to_brother() {
        let out = [];
        let carriage_direction = Direction.Right;
        let transfers = [...this.to_transfers()];
        while (transfers.length > 0) {
            let out_row = Array(this.stitch_count).fill(false);
            let done = [];
            for (let ti = 0; ti < transfers.length; ti++) {
                let transfer = transfers[ti];
                let select = transfer.select(carriage_direction);
                if (typeof select == "number") {
                    select = mod(select, this.stitch_count);
                }
                if (
                    select != null
                    && select != SELECT_NONE
                    && !(
                        out_row[select]
                        || out_row[mod(select - 1, this.stitch_count)]
                        || out_row[mod(select + 1, this.stitch_count)]
                    )
                ) {
                    out_row[select] = true;
                    let keep = transfer.step(carriage_direction);
                    if (!keep) {
                        done.push(ti);
                    }
                }
                // if it's a double transfer we might still need to step through the decrease steps even if we didn't select a needle
                if (transfer instanceof DoubleTransfer && select == SELECT_NONE) {
                    let keep = transfer.step(carriage_direction);
                    if (!keep) {
                        done.push(i);
                    }
                }
            }
            // remove transfers which are finished
            done.reverse();
            done.forEach((ti) => {
                transfers.splice(ti, 1);
            });
            carriage_direction = carriage_direction == Direction.Left ? Direction.Right : Direction.Left;
            out.push(out_row);
        }
        // Add empty rows to signal that the knit carriage should be used. Must have L->R blank, then R->L blank
        out.push(Array(this.stitch_count).fill(false));
        out.push(Array(this.stitch_count).fill(false));
        if (carriage_direction == Direction.Left) {
            out.push(Array(this.stitch_count).fill(false));
        }
        return out;
    }
}

function join_array(arr, separator, single_separator, last_separator) {
    if (single_separator == undefined) {
        single_separator = separator;
    }
    if (last_separator == undefined) {
        last_separator = separator;
    }
    if (arr.length == 1){
        return `${arr[0]}`;
    }
    if (arr.length == 2) {
        return `${arr[0]}${single_separator}${arr[1]}`;
    }
    return arr.slice(0, arr.length - 1).join(separator) + last_separator + `${arr[arr.length - 1]}`;
}

function human_readable_array(arr) {
    return join_array(arr, ", ", " and ", ", and ");
}

class Pattern {
    constructor(rows) {
        this.rows = rows;
        this.stitch_count = this.rows[0].stitch_count;
        // more convoluted but better error reporting
        const counts = this.rows.map((r) => r.stitch_count).reduce((acc, e) => acc.set(e, (acc.get(e) || 0) + 1), new Map());
        if (counts.keys().toArray().length > 1) {
            let counts_array = counts.entries().toArray();
            // counts = counts.entries().toArray();
            counts_array.sort((a, b) => { return b[1] - a[1]; });
            let wrong_count = counts_array.slice(1).reduce((acc, v) => acc + v[1], 0);
            let wrong_rows = {};
            counts_array.slice(1).forEach((c) => {
                wrong_rows[c[0]] = [];
                for (let ri = 0; ri < this.rows.length; ri++) {
                    let r = this.rows[ri];
                    if (r.stitch_count == c[0]) {
                        wrong_rows[c[0]].push(ri);
                    }
                }
            });
            if (counts_array.length > 3 || wrong_count > 5) {
                // too many varying row lengths to try and be helpful.
                throw new PatternError("Pattern rows do not have a consistent stitch count.", "highlight_multiple", "new Pattern", extras = {rows: []});
            }
            if (counts_array.length == 3) {
                throw new PatternError(`Pattern rows do not have a consistent stitch count. ` 
                    + `Most rows have ${counts_array[0][0]} stitches, but row${wrong_rows[counts_array[1][0]].length > 1 ? 's' : ''} ${human_readable_array(wrong_rows[counts_array[1][0]].map((r) => (r+1) * 2))} ${wrong_rows[counts_array[1][0]].length > 1 ? 'have' : 'has'} ${counts_array[1][0]} stitches and row${wrong_rows[counts_array[2][0]].length > 1 ? 's' : ''} ${human_readable_array(wrong_rows[counts_array[2][0]].map((r) => (r+1) * 2))} ${wrong_rows[counts_array[2][0]].length > 1 ? 'have' : 'has'} ${counts_array[2][0]} stitches.`, 
                    "highlight_multiple", 
                    "new Pattern",
                    {rows: wrong_rows[counts_array[1][0]].concat(wrong_rows[counts_array[2][0]])}
                );
            }
            throw new PatternError(`Pattern rows do not have a consistent stitch count. ` 
                + `Most rows have ${counts_array[0][0]} stitches, but row${wrong_rows[counts_array[1][0]].length > 1 ? 's' : ''} ${human_readable_array(wrong_rows[counts_array[1][0]].map((r) => (r+1) * 2))} ${wrong_rows[counts_array[1][0]].length > 1 ? 'have' : 'has'} ${counts_array[1][0]} stitches.`, 
                "highlight_multiple", 
                "new Pattern",
                {rows: wrong_rows[counts_array[1][0]]}
            );
        }
    }

    static from_string(str) {
        let lines = str.trim().toLowerCase().split("\n");
        lines = lines.filter((l) => l.length > 0);
        let rows = []
        for (let li = 0; li < lines.length; li++) {
            let l = lines[li];
            let r;
            try {
                r = Row.from_string(l);
            } catch (e) {
                if (e instanceof PatternError) {
                    e.add_trace("Pattern.from_string");
                    e.extras.row = li;
                }
                throw e;
            }
            rows.push(r);
        }
        return new Pattern(rows);
    }

    static from_chart(str) {
        let lines = str.trim().toLowerCase().split("\n");
        lines = lines.filter((l) => l.length > 0);
        lines.reverse();
        let rows = []
        lines.forEach((l) => {
            rows.push(Row.from_chart(l))
        })
        return new Pattern(rows);
    }

    to_chart_string() {
        let out = [];
        this.rows.reverse();
        // this.rows.forEach((r) => {
        //     out.push(r.to_chart_string());
        // });
        for (let ri = 0; ri < this.rows.length; ri++) {
            let r = this.rows[ri];
            try {
                out.push(r.to_chart_string());
            } catch (e) {
                this.rows.reverse();
                if (e instanceof PatternError) {
                    e.add_trace("Pattern.to_chart_string");
                    e.extras.row = ri;
                }
                throw e;
            }
        }
        this.rows.reverse();
        return out.join("\n");
    }

    to_chart() {
        let num_rows = this.rows.length;
        let num_stitches = this.stitch_count;
        let unit = 40;
        let width = (num_stitches + 2) * unit;
        let height = (num_rows + 2) * unit;
        let svg = {
            tag: "svg",
            attributes: {
                width: width,
                height: height,
                viewBox: `${-unit} ${-unit} ${width} ${height}`
            },
            children: [{
                tag: "rect",
                attributes: {
                    x: -unit,
                    y: -unit,
                    width: width,
                    height: height,
                    fill: colours.background.base
                }
            }]
        };
        for (let x = 1; x < num_stitches; x++) {
            svg.children.push({
                tag: "path",
                attributes: {
                    stroke: colours.foreground.base,
                    stroke_width: 1,
                    d: `M ${x * unit} ${0} L ${x * unit} ${num_rows * unit}`
                }
            })
        }
        for (let y = 1; y < num_rows; y++) {
            svg.children.push({
                tag: "path",
                attributes: {
                    stroke: colours.foreground.base,
                    stroke_width: 1,
                    d: `M ${0} ${y * unit} L ${num_stitches * unit} ${y * unit}`
                }
            })
        }
        svg.children.push(
            {
                tag: "rect",
                attributes: {
                    x: 0,
                    y: 0,
                    width: num_stitches * unit,
                    height: num_rows * unit,
                    stroke: colours.foreground.base,
                    stroke_width: 1,
                    fill: "none"
                }
            }
        )
        for (let x = 0; x < num_stitches; x++) {
            svg.children.push({
                tag: "text",
                attributes: {
                    text_anchor: "middle",
                    dominant_baseline: "middle",
                    fill: colours.foreground.base,
                    x: (x + 0.5) * unit,
                    y: (num_rows + 0.5) * unit
                },
                children: [`${x + 1}`]
            })
        }
        for (let y = 0; y < num_rows; y++) {
            svg.children.push({
                tag: "text",
                attributes: {
                    text_anchor: "middle",
                    dominant_baseline: "middle",
                    fill: colours.foreground.base,
                    x: (num_stitches + 0.5) * unit,
                    y: (num_rows - y - 0.5) * unit
                },
                children: [`${(y + 1) * 2}`]
            })
        }
        for (let ri = 0; ri < num_rows; ri++) {
            let row = this.rows[ri];
            let y = (num_rows - ri - 0.5) * unit;
            for (let ii = 0; ii < num_stitches; ii++) {
                let inst = row.expanded[ii];
                let x = (ii + 0.5) * unit;
                if (_RIGHT_DECREASES.includes(inst)) {
                    svg.children.push({
                        tag: "path",
                        attributes: {
                            stroke: colours.foreground.base,
                            stroke_width: 2,
                            d: `M ${x - unit * 0.25} ${y + unit * 0.25} L ${x + unit * 0.25} ${y - unit * 0.25} M ${x} ${y} L ${x + unit * 0.25} ${y + unit * 0.25}`,
                        }
                    });
                } else if (_LEFT_DECREASES.includes(inst)) {
                    svg.children.push({
                        tag: "path",
                        attributes: {
                            stroke: colours.foreground.base,
                            stroke_width: 2,
                            d: `M ${x + unit * 0.25} ${y + unit * 0.25} L ${x - unit * 0.25} ${y - unit * 0.25} M ${x} ${y} L ${x - unit * 0.25} ${y + unit * 0.25}`,
                        }
                    });
                } else if (_DOUBLE_DECREASES.includes(inst)) {
                    svg.children.push({
                        tag: "path",
                        attributes: {
                            stroke: colours.foreground.base,
                            stroke_width: 2,
                            d: `M ${x + unit * 0.25} ${y + unit * 0.25} L ${x} ${y - unit * 0.25} M ${x - unit * 0.25} ${y + unit * 0.25} L ${x} ${y - unit * 0.25} M ${x} ${y + unit * 0.25} L ${x} ${y - unit * 0.25}`,
                        }
                    });
                } else if (_INCREASES.includes(inst)) {
                    svg.children.push({
                        tag: "circle",
                        attributes: {
                            fill: "none",
                            stroke: colours.foreground.base,
                            stroke_width: 2,
                            cx: x,
                            cy: y,
                            r: 0.25 * unit
                        }
                    });
                }
            }
        }
        return construct_svg(svg);
    }

    to_brother() {
        let out = [];
        // this.rows.forEach((row) => {
        //     out = out.concat(row.to_brother());
        // })
        for (let ri = 0; ri < this.rows.length; ri++) {
            let row = this.rows[ri];
            try {
                out = out.concat(row.to_brother());
            } catch (e) {
                if (e instanceof PatternError) {
                    e.add_trace("Pattern.to_brother");
                    e.extras.row = ri;
                }
                throw e;
            }
        }
        out.reverse();
        return out;
    }

    to_punchcard() {
        let brother = this.to_brother();
        return brother.map((row) => row.map((c) => "-x"[c * 1]).join("")).join("\n");
    }
}

function construct_svg(svg) {
    /*  svg = {
            tag: "path",
            children: [svg...],
            attributes: {
                d: "M 0 0",
                stroke_width: 2
            }
        } etc
    */
    if (typeof svg == "string") {
        return svg; // allows for text as children.
    }
    let attrs = [];
    if (svg.attributes) {
        for (const [key, value] of Object.entries(svg.attributes)) {
            attrs.push(`${key.replace("_", "-")}="${value}"`);
        }
    }
    attrs = (attrs.length > 0 ? " " : "") + attrs.join(" ");
    let children = [];
    if (svg.children) {
        svg.children.forEach((c) => { children.push(construct_svg(c)); });
    }
    return `<${svg.tag}${attrs}>${children.join("")}</${svg.tag}>`;
}
