let sample_pattern = `Row 2 - k1-b, *yo, k6, ssk, k1, k2 tog, yo, k1, yo, sl 1-k2 tog-psso, yo, k3, yo, sl 1-k2 tog-psso, yo, k1, yo, ssk, k1, k2 tog, k6, yo, k1-b, rep from *
Row 4 - k1-b, *yo, k2, k2 tog, yo, ssk, k6, yo, ssk, k2 tog, yo, k1-b, yo, ssk, k2 tog, yo, k6, k2 tog, yo, ssk, k2, yo, k1-b, rep from *
Row 6 - k3, * k2 tog, yo, k1, yo, ssk, k1, k2 tog, yo2, ssk, k1, k2 tog, k1, yo, k1-b, yo, k1, ssk, k1, k2 tog, yo2, ssk, k1, k2 tog, yo, k1, yo, ssk, k5; rep from *, end last repeat k3
Row 8 - K2, * k2 tog, (yo2, sl 1-k2 tog -psso) twice, yo2, ssk, k1, k2 tog, k2, yo,k1-b, yo, k2, ssk, k1, k2 tog, yo2, (sl 1-k2 tog-psso, yo2) twice, ssk, k3; rep from*, end last repeat k2.
Row 10 - k1, * k2 tog, yo, k6, yo, ssk, k1, k2 tog, k3, yo, k1-b, yo, k3, ssk, k1, k2 tog, yo, k6, yo, ssk, k1; rep from *.
Row 12 - K2 tog, * (yo2, sl 1- k2 tog - psso) twice, yo2, ssk, k1, k2 tog, k4, yo, k1-b, yo, k4, ssk, k1, k2 tog, yo2, (sl 1- k2 tog -psso, yo2) twice, sl 1- k2 tog - psso; rep from *, end last repeat ssk instead of sl 1-k2 tog - psso.
Row 14 - K7, * yo, ssk, k1, k2 tog, k5, yo, k1-b, yo, k5, ssk, k1, k2 tog, yo, k13; rep from *, end last repeat k7.
Row 16 - K2, * yo, sl 1-k2 tog - psso, yo, k1, yo, ssk, k1, k2 tog, k6, yo, k1-b, yo, k6, ssk, k1, k2 tog, yo, k1, yo, sl 1- k2 tog- psso, yo, k3; rep from *, end last repeat k2.
Row 18 - k1-b, * yo, ssk, k2 tog, yo, k6, k2 tog, yo, ssk, k2, yo, k1-b, yo, k2, k2 tog, yo, ssk, k6, yo, ssk, k2 tog, yo, k1-b; rep from *.
Row 20 - k1-b, * yo, k1, ssk, k1, k2 tog, yo2, ssk, k1, k2 tog, yo, k1, yo, ssk, k5, k2 tog, yo, k1, yo, ssk, k1, k2 tog, yo2, ssk, k1, k2 tog, k1, yo, k1-b; rep from *.
Row 22 - k1-b, * yo, k2, ssk, k1, k2 tog, (yo2, sl 1-k2 tog - psso) twice, yo2, ssk, k3, k2 tog, yo2, (sl 1-k2 tog -psso, yo2) twice, ssk, k1, k2 tog, k2, yo, k1-b; rep from *.
Row 24 - k1-b, * yo, k3, (ssk, k1, k2 tog, yo, k6, yo) twice, ssk, k1, k2 tog, k3, yo, k1-b; rep from *.
Row 26 - k1-b, * yo, k4, ssk, k1, k2 tog, (yo2, sl 1-k2 tog- psso) 5 times, yo2, ssk, k1, k2 tog, k4, yo, k1-b; rep from *.
Row 28 - k1-b, * yo, k5, ssk, k1, k2 tog, yo, k13, yo, ssk, k1, k2 tog, k5, yo, k1-b; rep from *.`;

let sample_chart = `.o.....\\./o.............o\\./.....o.
.o....\\./oo^oo^oo^oo^oo^oo\\./....o.
.o...\\./o......o\\./o......o\\./...o.
.o..\\./oo^oo^oo\\.../oo^oo^oo\\./..o.
.o.\\./oo\\./o.o\\...../o.o\\./oo\\./.o.
.o\\/o....../o\\..o.o../o\\......o\\/o.
..o^o.o\\./......o.o......\\./o.o^o..
.......o\\./.....o.o.....\\./o.......
/oo^oo^oo\\./....o.o....\\./oo^oo^oo\\
./o......o\\./...o.o...\\./o......o\\.
../oo^oo^oo\\./..o.o..\\./oo^oo^oo\\..
.../o.o\\./oo\\./.o.o.\\./oo\\./o.o\\...
.o../o\\......o\\/o.o\\/o....../o\\..o.
.o......\\./o.o^o...o^o.o\\./......o.`;

function array_to_image(data, canvas) {
    // let canvas = document.getElementById(canvas_id);
    let ctx = canvas.getContext('2d');

    height = data.length;
    width = data[0].length;

    canvas.width = width;
    canvas.height = height;

    let img_data = ctx.createImageData(width, height);
    let buffer = img_data.data;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let idx = (y * width + x) * 4;
            let v = data[y][x] ? 0 : 255;
            buffer[idx] = v;
            buffer[idx + 1] = v;
            buffer[idx + 2] = v;
            buffer[idx + 3] = 255;
        }
    }

    ctx.putImageData(img_data, 0 ,0);
}


let pattern;
// let input = document.getElementById("pattern");
// input.setAttribute("placeholder", "Enter your pattern here...")
let input = window.CMExport.input;
let button = document.getElementById("render");

let svg_container = document.getElementById("svg-container");
let chart_text_container = document.getElementById("chart-text-container");
let ayab_canvas = document.getElementById("ayab-canvas");
let punchcard_container = document.getElementById("punchcard-container");

let chart_text_pre = document.getElementById("chart-text-pre");
let punchcard_pre = document.getElementById("punchcard-pre");

let error_container = document.getElementById("error-container");

function get_content_rect(element) {
    // internal width and height without margin, padding, border etc. Does not check for box-sizing.
    let bbox = element.getBoundingClientRect();
    let computed_style = window.getComputedStyle(element);
    let dimensions = {
        width: bbox.width,
        height: bbox.height
    };
    dimensions.width -= parseFloat(computed_style.borderLeftWidth) + parseFloat(computed_style.marginLeft) + parseFloat(computed_style.paddingLeft)
        + parseFloat(computed_style.borderRightWidth) + parseFloat(computed_style.marginRight) + parseFloat(computed_style.paddingRight);
    dimensions.height -= parseFloat(computed_style.borderTopWidth) + parseFloat(computed_style.marginTop) + parseFloat(computed_style.paddingTop)
        + parseFloat(computed_style.borderBottomWidth) + parseFloat(computed_style.marginBottom) + parseFloat(computed_style.paddingBottom);
    return dimensions;
}

function show_error(error) {
    error_container.innerHTML = "";
    let h = document.createElement("h2");
    h.innerText = "Error";
    let p = document.createElement("p");
    p.innerText = "Error whilst parsing the input pattern: " + error.message;
    error_container.appendChild(h);
    error_container.appendChild(p);
    // if (error.extras.idx != undefined && error.extras.idx_end != undefined && error.extras.row != undefined){
    //     input.highlight_error(error.extras.row, error.extras.idx, error.extras.idx_end);
    // }
    console.error(error);
    console.error(error.type);
    console.error(error.extras);
    switch (error.type) {
        case "highlight_word":
            input.highlight_error(error.extras.row, error.extras.idx, error.extras.idx_end);
            break;
        case "highlight_start":
            input.highlight_error_fade(error.extras.row, error.extras.idx);
            break;
        case "highlight_row":
            input.highlight_rows(error.extras.row);
            break;
        case "highlight_multiple":
            input.highlight_rows(error.extras.rows);
            break;
    }
    error_container.classList.add("has-error");
}

function clear_error(){
    error_container.innerHTML = "";
    input.remove_highlighting();
    error_container.classList.remove("has-error");
}

function resize_elements() {
    let bbox = get_content_rect(document.querySelector(".tabs__panels"));
    // scaling canvas
    let max_width = bbox.width * 0.4;
    let max_height = bbox.height * 0.8;
    s = max_width / ayab_canvas.width;
    s = max_height / ayab_canvas.height < s ? max_height / ayab_canvas.height : s;
    s = Math.min(s, 20);
    ayab_canvas.style.width = `${ayab_canvas.width * s}px`;
    ayab_canvas.style.height = `${ayab_canvas.height * s}px`;
    // text outputs
    chart_text_pre.style.maxHeight = max_height + "px";
    punchcard_pre.style.maxHeight = max_height + "px";

}

function render() {
    clear_error();
    try {
        if (input_type_checkbox.checked) {
            pattern = Pattern.from_chart(input.state.doc.toString());
        } else {
            pattern = Pattern.from_string(input.state.doc.toString());
        }
        svg_container.innerHTML = pattern.to_chart();
        let svg = svg_container.querySelector("svg");
        svg.style.maxWidth = "100%";

        chart_text_pre.innerText = pattern.to_chart_string();

        let data = pattern.to_brother();
        array_to_image(data, ayab_canvas);

        punchcard_pre.innerText = pattern.to_punchcard();

        resize_elements();
    } catch (e) {
        console.error("process.js Error");
        console.error(e.name);
        Toastify({
            text: "Error processing pattern",
            duration: 2000,
            gravity: "top",
            position: "center",
            close: true,
            style: {
                background: "var(--clr-error-5)",
                border: "2px solid var(--clr-error)",
                borderRadius: "1rem",
                color: "var(--clr-foreground)"
            }
        }).showToast();
        if (e instanceof PatternError) {
            show_error(e);
            return;
        }
    }
}
button.onclick = render;

// render();

window.onresize = resize_elements(); // this doesn't really work when the window is shrinking

let filename_inputs = [
    document.getElementById("chart_filename"),
    document.getElementById("chart_text_filename"),
    document.getElementById("ayab_filename"),
    document.getElementById("punchcard_filename"),
];

function filename_changed(e) {
    let new_name = e.target.innerText;
    filename_inputs.forEach((i) => {
        if (i == e.target) {return} 
        i.innerText = new_name;
    });
}

filename_inputs.forEach((i) => {i.oninput = filename_changed});

function download_file(name, contents, type = "data:text;charset=utf-8,", compress = true) {
    console.log("Downloading " + name + "...");
    let url = type + (compress ? encodeURIComponent(contents) : contents);
    let a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    console.log("Done");
}

function download_chart() {
    let name = filename_inputs[0].innerText;
    name += filename_inputs[0].nextElementSibling.innerText;
    console.log(name);
    let source = pattern.to_chart();
    //add name spaces.
    if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }
    //add xml declaration
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    download_file(name, source);
}

function download_chart_text() {
    let name = filename_inputs[1].innerText;
    name += filename_inputs[1].nextElementSibling.innerText;
    download_file(name, chart_text_pre.innerText);
}

function download_ayab() {
    let name = filename_inputs[2].innerText;
    name += filename_inputs[2].nextElementSibling.innerText;
    let img = ayab_canvas.toDataURL('image/png');
    download_file(name, img, "", false);
}

function download_punchcard() {
    let name = filename_inputs[3].innerText;
    name += filename_inputs[3].nextElementSibling.innerText;
    download_file(name, punchcard_pre.innerText);
}

function copy_chart_text() {
    let text = chart_text_pre.innerText;
    navigator.clipboard.writeText(text);
    Toastify({
        text: "Copied!",
        duration: 2000,
        gravity: "top",
        position: "center",
        close: true,
        style: {
            background: "var(--clr-success-5)",
            border: "2px solid var(--clr-success)",
            borderRadius: "1rem",
            color: "var(--clr-foreground)"
        }
    }).showToast();
}

function copy_punchcard() {
    let text = punchcard_pre.innerText;
    navigator.clipboard.writeText(text);
    Toastify({
        text: "Copied!",
        duration: 2000,
        gravity: "top",
        position: "center",
        close: true,
        style: {
            background: "var(--clr-success-5)",
            border: "2px solid var(--clr-success)",
            borderRadius: "1rem",
            color: "var(--clr-foreground)"
        }
    }).showToast();
}

function set_input(str) {
    input.dispatch({
        changes: {
            from: 0,
            to: input.state.doc.length,
            insert: str
        }
    });
}

function load_sample_full() {
    set_input(sample_pattern);
    render();
}

function load_sample_chart() {
    set_input(sample_chart);
    render();
}

let input_type_checkbox = document.getElementById("is-chart-checkbox");
// uncheck to avoid errors due to a cached input
input_type_checkbox.checked = false;
let input_details_instructions = document.getElementById("input-details-instructions");
let input_details_chart = document.getElementById("input-details-chart");

let last_instructions = "";
let last_chart = "";

function input_type_changed() {
    if (input_type_checkbox.checked) {
        input_details_instructions.setAttribute("hidden", "");
        input_details_chart.removeAttribute("hidden");
        last_instructions = input.state.doc.toString();
        set_input(last_chart);
    } else {
        input_details_chart.setAttribute("hidden", "");
        input_details_instructions.removeAttribute("hidden");
        last_chart = input.state.doc.toString();
        set_input(last_instructions);
    }
}

input_type_checkbox.onchange = input_type_changed;
