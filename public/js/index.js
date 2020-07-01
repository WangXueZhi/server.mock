// new | edit
let formType = 'add'

// 请求封装
const _fetch = function (option) {
    // 请求前缀
    let fetchBaseUrl = `http://127.0.0.1:${window.serverPort}/api`
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `${fetchBaseUrl}${option.url}`,
            type: option.method,
            data: option.data,
            dataType: 'json',
            contentType: false,
            processData: false,
            success: function (res) {
                if (res.code != 0) {
                    reject(res)
                } else {
                    resolve(res)
                }
            },
            error: function (err) {
                reject(err)
            }
        });
    })
}

// 添加窗口
const openNewModal = function () {
    formType = 'add'
    $('#staticBackdrop').modal('show')
    $('#projectModalTitle').text('添加项目')
    clearModalForm()
}

// 清除窗口信息
const clearModalForm = function () {
    $('#projectModalInputName').val('')
    $('#projectModalInputDesc').val('')
    $('#dataSourcefile input').val('')
    $('#dataSourcecode textarea').val('')
    $('#dataSourcelink input').val('')
    $('.dataSource').hide()
    $('input.dataType:checked').prop("checked", false);
    $('#projectModalInputName').prop("readonly", false);
}

// 编辑窗口
const editModal = function (data) {
    formType = 'edit'
    $('#staticBackdrop').modal('show')
    $('#projectModalTitle').text('编辑项目')
    $('#projectModalInputName').val(data.name)
    $('#projectModalInputDesc').val(data.desc)
    $('#projectModalInputName').prop("readonly", true);
}

// 删除窗口
const deleteModal = function (data) {
    $('#confirmDelete').modal('show')
    $('#deleteBody span').text(data.name)
    $('#sureDeleteBtn').data('projectName', data.name)
}

// 获取项目列表
const getProjectList = function () {
    return _fetch({
        url: '/project/list',
        method: 'get'
    })
}

// 初始化项目列表
const loadProjectList = function () {
    $('.project-list-box').empty()
    _fetch({
        url: '/project/list',
        method: 'get'
    }).then(res => {
        window.projectList = res.data
        res.data.forEach((item, index) => {
            $('.project-list-box').append($(`<div class="project-list-item row">
            <div class="project-list-item-name col-sm-3">${item.name}</div>
            <div class="project-list-item-desc col-sm-3">${item.desc}</div>
            <div class="project-list-item-desc col-sm-3">${location.protocol}//${location.host}/mock/${item.name}</div>
            <div class="project-list-item-operate col-sm-3">
                <button class="project-edit-modal btn btn-primary btn-sm" type="button" data-index="${index}">编辑</button>
                <button class="project-delete btn btn-danger btn-sm" type="button" data-index="${index}">删除</button>
            </div>
        </div>`))
        })
    }).catch(err => {
        alert(err)
    })
}

// main
$(document).ready(function () {
    loadProjectList()

    // 切换数据源类型
    $('input.dataType').change(function () {
        $('.dataSource').hide()
        $('#dataSourcefile input').val('')
        $('#dataSourcecode textarea').val('')
        $('#dataSourcelink input').val('')
        $(`#dataSource${this.value}`).show()
    });
    // 窗口确定按钮
    $(document).on('click', '#sureBtn', function () {
        //根据ID获得页面当中的form表单元素
        var form = document.querySelector("#form");
        //将获得的表单元素作为参数，对formData进行初始化
        var formdata = new FormData(form);
        window.fd = formdata
        _fetch({
            url: `/project/${formType}`,
            method: 'post',
            data: formdata
        }).then(res => {
            if (formType === 'add') {
                alert('创建成功')
            } else {
                alert('保存成功')
            }

            $('#staticBackdrop').modal('hide')
            clearModalForm()
            loadProjectList()
        }).catch(res => {
            console.log(res)
            alert(res.message)
        })
        // $('#staticBackdrop').modal('hide')
    })
    // 打开添加窗口
    $(document).on('click', '#openNewModal', function () {
        openNewModal()
    })
    // 打开编辑窗口
    $(document).on('click', '.project-edit-modal', function () {
        editModal(window.projectList[$(this).data('index')])
    })
    // 项目窗口关闭
    $(document).on('click', '.close-project-modal', function () {
        $('#staticBackdrop').modal('hide')
        clearModalForm()
    })

    // 删除项目
    $(document).on('click', '.project-delete', function () {
        deleteModal(window.projectList[$(this).data('index')])
    })
    $('#sureDeleteBtn').click(function () {
        const thisBtn = $(this)
        var fd = new FormData();
        fd.append("name", thisBtn.data('projectName'))
        _fetch({
            url: `/project/delete`,
            method: 'post',
            data: fd
        }).then(res => {
            alert('删除成功')
            $('#confirmDelete').modal('hide')
            thisBtn.data('projectName', '')
            loadProjectList()
        }).catch(res => {
            console.log(res)
            alert(res.message)
        })
    })
});