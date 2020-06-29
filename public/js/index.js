// new | edit
let formType = 'new'

// 添加窗口
const openNewModal = function () {
    formType = 'new'
    $('#staticBackdrop').modal('show')
    $('#projectModalTitle').text('添加项目')
    $('#projectModalInputName').val('')
    $('#projectModalInputDesc').val('')
    $('#dataTypefile input').val('')
    $('#dataTypecode textarea').val('')
    $('#dataTypelink input').val('')
    $('.dataType').hide()
    $('input[type=radio][name=inlineRadioOptions]:checked').prop("checked", false);
}

// 编辑窗口
const editModal = function (data) {
    formType = 'edit'
    $('#staticBackdrop').modal('show')
    $('#projectModalTitle').text('编辑项目')
    $('#projectModalInputName').val(data.name)
    $('#projectModalInputDesc').val(data.describe)
}

// main
$(document).ready(function () {
    $('input[type=radio][name=inlineRadioOptions]').change(function () {
        $('.dataType').hide()
        $(`#dataType${this.value}`).show()
    });
    $('#sureBtn').click(function () {
        $('#staticBackdrop').modal('hide')
    })
    $('#openNewModal').click(function(){
        openNewModal()
    })
    $('.project-edit-modal').click(function(){
        editModal(window.projectList[$(this).data('index')])
    })
});