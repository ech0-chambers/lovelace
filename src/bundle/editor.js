import {Extension, EditorState, StateField, StateEffect} from "@codemirror/state"
import {
  EditorView, keymap, highlightSpecialChars, drawSelection,
  highlightActiveLine, dropCursor, rectangularSelection,
  crosshairCursor, lineNumbers, highlightActiveLineGutter,
  Decoration, placeholder
} from "@codemirror/view"
import {
  defaultHighlightStyle, syntaxHighlighting, indentOnInput,
  bracketMatching, foldGutter, foldKeymap
} from "@codemirror/language"
import {
  defaultKeymap, history, historyKeymap
} from "@codemirror/commands"
import {
  searchKeymap, highlightSelectionMatches
} from "@codemirror/search"
import {
  autocompletion, completionKeymap, closeBrackets,
  closeBracketsKeymap
} from "@codemirror/autocomplete"
import {lintKeymap} from "@codemirror/lint"

let pattern_container = document.getElementById("pattern-container");



const addMarks = StateEffect.define(), filterMarks = StateEffect.define();
// This value must be added to the set of extensions to enable this
const markField = StateField.define({
  // Start with an empty set of decorations
  create() { return Decoration.none },
  // This is called whenever the editor updates—it computes the new set
  update(value, tr) {
    // Move the decorations to account for document changes
    value = value.map(tr.changes)
    // If this transaction adds or removes decorations, apply those changes
    for (let effect of tr.effects) {
      if (effect.is(addMarks)) value = value.update({add: effect.value, sort: true})
      else if (effect.is(filterMarks)) value = value.update({filter: effect.value})
    }
    return value
  },
  // Indicate that this field provides a set of decorations
  provide: f => EditorView.decorations.from(f)
});

const error_mark = Decoration.mark({
  attributes: {style: "background-color: var(--clr-red-3); color: var(--clr-background); font-weight: 500;"}
});

const error_mark_fade = Decoration.mark({
    attributes: {style: "background-image: linear-gradient(to right, var(--clr-red-3), #00000000);"}
});

let placeholder_text = "Enter your pattern here...";

const input = new EditorView({
  doc: "",
  parent: pattern_container,
  extensions: [
    // A line number gutter
    // lineNumbers(),
    // A gutter with code folding markers
    // foldGutter(),
    // Replace non-printable characters with placeholders
    highlightSpecialChars(),
    // placeholder text
    placeholder(placeholder_text),
    // The undo history
    history(),
    // Replace native cursor/selection with our own
    drawSelection(),
    // Show a drop cursor when dragging over the editor
    dropCursor(),
    // Allow multiple cursors/selections
    EditorState.allowMultipleSelections.of(true),
    // Re-indent lines when typing specific input
    // indentOnInput(),
    // Highlight syntax with a default style
    // syntaxHighlighting(defaultHighlightStyle),
    // Highlight matching brackets near cursor
    bracketMatching(),
    // Automatically close brackets
    closeBrackets(),
    // Load the autocompletion system
    autocompletion(),
    // Allow alt-drag to select rectangular regions
    rectangularSelection(),
    // Change the cursor to a crosshair when holding alt
    crosshairCursor(),
    // Style the current line specially
    highlightActiveLine(),
    // Style the gutter for current line specially
    // highlightActiveLineGutter(),
    // Highlight text that matches the selected text
    highlightSelectionMatches(),
    // line wrap
    EditorView.lineWrapping,
    markField,
    keymap.of([
      // Closed-brackets aware backspace
      ...closeBracketsKeymap,
      // A large set of basic bindings
      ...defaultKeymap,
      // Search-related keys
      ...searchKeymap,
      // Redo/undo keys
      ...historyKeymap,
      // Code folding bindings
    //   ...foldKeymap,
      // Autocompletion keys
      ...completionKeymap,
      // Keys related to the linter system
    //   ...lintKeymap
    ])
  ]
})

input.highlight_error = (row, start, end) => {
    let row_start = input.state.doc.line(row + 1).from;
    input.dispatch({
        effects: addMarks.of([error_mark.range(row_start + start, row_start + end)])
    });
}

input.highlight_error_fade = (row, start) => {
    let row_start = input.state.doc.line(row + 1).from;
    let row_end = input.state.doc.line(row + 1).to;
    input.dispatch({
        effects: addMarks.of([error_mark_fade.range(row_start + start, Math.min(row_start + start + 20, row_end))])
    });
}

input.highlight_rows = (rows) => {
    if (typeof rows == "number") {
        rows = [rows];
    }
    input.dispatch({
        effects: addMarks.of(rows.map((r) => error_mark.range(input.state.doc.line(r+1).from, input.state.doc.line(r+1).to)))
    });
}

input.remove_highlighting = () => {
    input.dispatch({
        effects: filterMarks.of((from, to) => false)
    });
}

export {input};
