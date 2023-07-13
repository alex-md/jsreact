const ORIGINAL_TEXT_AREA = document.getElementById('originalTextArea');
const MODIFIED_TEXT_AREA = document.getElementById('modifiedTextArea');
const DIFF_RESPONSE_AREA = document.getElementById('diffResponseArea');
const DIFF_RESPONSE_CONTAINER = document.getElementById('diffResponseContainer');
const ERROR_CONTAINER = document.getElementById('errorContainer');
const RETURN_PATTERN = new RegExp('&para;', 'g');
const originalTextAreaEditor = CodeMirror.fromTextArea(ORIGINAL_TEXT_AREA, {
    value: ORIGINAL_TEXT_AREA.value,
    lineNumbers: true,
});
const modifiedTextAreaEditor = CodeMirror.fromTextArea(MODIFIED_TEXT_AREA, {
    value: MODIFIED_TEXT_AREA.value,
    lineNumbers: true,
});
document.getElementById('findDiffBtn').addEventListener('click', () => {
    const diffParser = new diff_match_patch();
    const diff = diffParser.diff_main(originalTextAreaEditor.getValue(), modifiedTextAreaEditor.getValue());
    diffParser.diff_cleanupEfficiency(diff);
    const diffText = diffParser.diff_prettyHtml(diff);
    const sanitisedDiffText = diffText.replace(RETURN_PATTERN, '');
    if (sanitisedDiffText == '') {
        DIFF_RESPONSE_AREA.style.display = 'none';
        ERROR_CONTAINER.innerHTML = 'Please add texts to compare and generate the difference';
        ERROR_CONTAINER.style.display = 'block';
    } else {
        ERROR_CONTAINER.style.display = 'none';
        DIFF_RESPONSE_CONTAINER.innerHTML = sanitisedDiffText;
        DIFF_RESPONSE_AREA.style.display = 'flex';
    }
});
