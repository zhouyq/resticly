/**
 * Snapshot detail page specific JavaScript
 */

/**
 * Initialize the snapshot detail page
 * @param {string} snapshotId - ID of the snapshot
 * @param {number} repositoryId - ID of the repository
 */
function initSnapshotDetailPage(snapshotId, repositoryId) {
    // 设置全局变量
    window.snapshotId = snapshotId;
    window.repositoryId = repositoryId;
    
    // 加载文件列表
    loadSnapshotFiles();
    
    // 设置按钮事件处理程序
    setupEventHandlers();
}

/**
 * Load files in the snapshot
 */
function loadSnapshotFiles() {
    showLoading();
    
    apiRequest(`/api/snapshots/${window.snapshotId}/files`)
        .then(response => {
            if (response.error) {
                showToast(response.error, 'danger');
                return;
            }
            
            renderFilesList(response);
        })
        .catch(error => {
            console.error('Error loading snapshot files:', error);
            showToast('无法加载文件列表', 'danger');
        })
        .finally(() => {
            hideLoading();
        });
}

/**
 * Render files list in the table
 * @param {Array} files - List of files
 */
function renderFilesList(files) {
    const tableBody = document.getElementById('filesTableBody');
    
    if (!files || files.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center">没有文件</td></tr>';
        return;
    }
    
    // 对文件路径进行排序
    files.sort((a, b) => a.path.localeCompare(b.path));
    
    let html = '';
    
    files.forEach(file => {
        html += `
            <tr>
                <td><code>${file.path}</code></td>
                <td>${formatSize(file.size)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary restore-file" data-path="${file.path}">
                        恢复
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    
    // 添加单个文件恢复事件处理程序
    document.querySelectorAll('.restore-file').forEach(button => {
        button.addEventListener('click', function() {
            const path = this.getAttribute('data-path');
            showRestoreModal([path]);
        });
    });
}

/**
 * Setup event handlers for buttons
 */
function setupEventHandlers() {
    // 刷新文件列表按钮
    document.getElementById('refreshFilesList').addEventListener('click', loadSnapshotFiles);
    
    // 恢复快照按钮
    document.getElementById('restoreButton').addEventListener('click', function() {
        showRestoreModal();
    });
    
    // 确认恢复按钮
    document.getElementById('confirmRestore').addEventListener('click', function() {
        restoreSnapshot();
    });
    
    // 删除快照按钮
    document.getElementById('forgetButton').addEventListener('click', function() {
        // 显示确认对话框
        const modal = new bootstrap.Modal(document.getElementById('forgetModal'));
        modal.show();
    });
    
    // 确认删除按钮
    document.getElementById('confirmForget').addEventListener('click', function() {
        forgetSnapshot();
    });
}

/**
 * Show restore modal with optional pre-filled paths
 * @param {Array} paths - Optional list of specific paths to restore
 */
function showRestoreModal(paths = []) {
    // 清除之前的值
    document.getElementById('targetPath').value = '';
    document.getElementById('overwriteExisting').checked = false;
    
    // 如果提供了路径，填充包含路径字段
    if (paths && paths.length > 0) {
        document.getElementById('includePaths').value = paths.join('\n');
    } else {
        document.getElementById('includePaths').value = '';
    }
    
    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('restoreModal'));
    modal.show();
}

/**
 * Restore the snapshot
 */
function restoreSnapshot() {
    const targetPath = document.getElementById('targetPath').value.trim();
    
    if (!targetPath) {
        showToast('请指定恢复目标路径', 'warning');
        return;
    }
    
    const overwriteExisting = document.getElementById('overwriteExisting').checked;
    
    // 处理包含路径（如果有）
    let includePaths = document.getElementById('includePaths').value.trim();
    includePaths = includePaths ? includePaths.split('\n').filter(path => path.trim()) : [];
    
    showLoading();
    
    apiRequest(`/api/snapshots/${window.snapshotId}/restore`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            target_path: targetPath,
            overwrite: overwriteExisting,
            include_paths: includePaths
        })
    })
    .then(response => {
        if (response.error) {
            showToast(response.error, 'danger');
            return;
        }
        
        // 关闭模态框
        bootstrap.Modal.getInstance(document.getElementById('restoreModal')).hide();
        
        showToast('快照恢复成功', 'success');
    })
    .catch(error => {
        console.error('Error restoring snapshot:', error);
        showToast('恢复快照失败', 'danger');
    })
    .finally(() => {
        hideLoading();
    });
}

/**
 * Forget (delete) the snapshot
 */
function forgetSnapshot() {
    const prune = document.getElementById('pruneAfterForget').checked;
    
    showLoading();
    
    apiRequest(`/api/snapshots/${window.snapshotId}/forget`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prune: prune
        })
    })
    .then(response => {
        if (response.error) {
            showToast(response.error, 'danger');
            return;
        }
        
        // 关闭模态框
        bootstrap.Modal.getInstance(document.getElementById('forgetModal')).hide();
        
        showToast('快照已删除', 'success');
        
        // 延迟后重定向到快照列表页面
        setTimeout(() => {
            window.location.href = '/snapshots';
        }, 1500);
    })
    .catch(error => {
        console.error('Error forgetting snapshot:', error);
        showToast('删除快照失败', 'danger');
    })
    .finally(() => {
        hideLoading();
    });
}