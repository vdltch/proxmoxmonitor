function storeDataInLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getDataFromLocalStorage(key) {
    return JSON.parse(localStorage.getItem(key));
}
function isDataInLocalStorage(key) {
    return localStorage.getItem(key) !== null;
}

document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    let node = urlParams.get('node_hyp');

    if (!node) {
        node = 'eh017';
    }

    const nodesLinks = document.querySelectorAll('.sub-menu-content a');

    function updateNodeParam(nodeName) {
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('node_hyp', nodeName);
        const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
        window.history.pushState({}, '', newUrl);
    }

    nodesLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            const nodeName = this.textContent.trim();
            updateNodeParam(nodeName);
            window.location.reload();
        });
    });
    
    const popup = document.getElementById('popup');
    const popupContent = document.getElementById('popupContentText');
    const apiUrlforAllVM = `http://int-proxmoxmonitor.eisge.com/ws/hyperviseur/getAllcurrentVmsInfos?node=${node}`; // API pour toutes les infos des VM
    const tableLoader = document.getElementById('vmTable');
    const refreshAction = document.querySelector('.refresh');
    var dattestlocal = localStorage.getItem(`${node}`);
    let storedTimestamp = localStorage.getItem(`${node}_timestamp`);
    
    if (!storedTimestamp) {
        const currentTime = new Date();
        const timestamp = Math.floor(currentTime.getTime() / 1000);
        localStorage.setItem(`${node}_timestamp`, timestamp.toString());
        storedTimestamp = timestamp;
    }

    const storedDate = new Date(parseInt(storedTimestamp) * 1000);
    console.log("Stored Date:", storedDate);

    function clearLocalStorage() {
        const currentTime = new Date().getTime();
        const storedTime = parseInt(storedTimestamp) * 1000;
        if (currentTime - storedTime >= 5 * 60 * 1000) {
            localStorage.clear();
            console.log("LocalStorage cleared.");
            window.location.reload();
        }
    }

    setInterval(clearLocalStorage, 5 * 60 * 1000);

    const tableHeaders = document.querySelectorAll('#vmTable th');
    let currentSortedColumn = null;
    let isAscending = true;

    function sortTable(columnIndex) {
        const rows = Array.from(document.querySelectorAll('#vmTable tbody tr'));

        rows.sort((rowA, rowB) => {
            const cellA = rowA.cells[columnIndex].innerText.trim();
            const cellB = rowB.cells[columnIndex].innerText.trim();

            if (cellA < cellB) return isAscending ? -1 : 1;
            if (cellA > cellB) return isAscending ? 1 : -1;
            return 0;
        });

        const tbody = document.querySelector('#vmTable tbody');
        rows.forEach(row => {
            tbody.appendChild(row);
        });
    }

    tableHeaders.forEach((header, index) => {
        header.addEventListener('click', function () {
            const clickedColumnIndex = index;

            if (currentSortedColumn === clickedColumnIndex) {
                isAscending = !isAscending;
            } else {
                isAscending = true;
                currentSortedColumn = clickedColumnIndex;
            }

            tableHeaders.forEach(header => {
                header.classList.remove('asc', 'desc');
            });

            if (isAscending) {
                header.classList.add('asc');
            } else {
                header.classList.add('desc');
            }

            sortTable(clickedColumnIndex);
        });
    });

    if (dattestlocal) {
        dataForAllVmLocal = JSON.parse(dattestlocal);
        displayData(dataForAllVmLocal);
        
    } 
    else {
        refreshAction.style.display = 'none';
        tableLoader.innerHTML = ' <div class="loader" id="loader"></div>';

        fetch(apiUrlforAllVM)
            .then(response => response.json())
            .then(dataForAllVm => {
                if (dataForAllVm.success) {
                    localStorage.setItem(`${node}`, JSON.stringify(dataForAllVm.data));
                    dataForAllVm = dataForAllVm.data && dataForAllVm.errors;
                    displayData(dataForAllVm);
                    tableLoader.innerHTML = '';
                    window.location.reload();
                    refreshAction.style.display = '';
                } else {
                    popup.style.display = 'block';
                    popupContent.innerHTML = `<h3>Could not fetch data. Please try again later.</h3>`;
                }
            })
            .catch(error => {
                popup.style.display = 'block';
                popupContent.innerHTML = `<h3>Error: ${error.message}</h3>`;
            });
        }

    function displayData(data) {

        const table = document.getElementById('vmTable').getElementsByTagName('tbody')[0];

        data.forEach(vm => {
        
            const apiUrlForRollback = `http://int-proxmoxmonitor.eisge.com/ws/hyperviseur/rollbackKFTVm?node=${node}&vmid=${vm.vmid}`;
            const apiUrlForAudit = `http://int-proxmoxmonitor.eisge.com/ws/hyperviseur/generateKFTDatabaseAudit?node=${node}&vmid=${vm.vmid}`;
            const statusClass = vm.status === 'stopped' ? 'red' : 'statusPilsBanner';

            if (vm.status === 'running') {
                console.log(`VM n°${vm.vmid} is running`);
            } else {
                const statusElement = document.getElementById(`btnStatus_${vm.vmid}`);
                if (statusElement) {
                    statusElement.classList.add(`vmStopped_${vm.vmid}`);
                } else {
                    console.error(`Element with ID 'btnStatus_${vm.vmid}' not found.`);
                }
            }
            
            const row = table.insertRow();
            const cell0 = row.insertCell(0)
            const cell1 = row.insertCell(1);
            const cell2 = row.insertCell(2);
            const cell3 = row.insertCell(3);
            const cell4 = row.insertCell(4);
            const cell5 = row.insertCell(5);
            const cell6 = row.insertCell(6);
            const cell7 = row.insertCell(7);
            const cell8 = row.insertCell(8);
            const cell9 = row.insertCell(9);
            const cell10 = row.insertCell(10);
            const cell11 = row.insertCell(11);

            cell0.innerHTML = ' <div class="loader" id="loader"></div>';
            cell1.innerHTML = ` <input type="checkbox" name="" id="check_${vm.vmid}">`;
            cell2.innerHTML = `<div id="selectedHostnamesDisplay" class="table-cell selected_${vm.vmid}">${vm.hostname}</div>`;
            cell3.innerHTML = `<div class="table-cell">${vm.vmid}</div>`;
            cell4.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; -2px">
                <div id="btnStatus_${vm.vmid}" class="table-cell ${statusClass}">${vm.status}</div> 
                <div style="display:none;" id="maintenance_status_${vm.vmid}" class="table-cell ${statusClass}">Under Maintenance</div> 
                <div style="display: flex; align-items: center; gap: 15px; margin-left:10px; cursor: pointer;">
                    <p id="btnForReboot_${vm.vmid}">
                        <svg width="13px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path d="M463.5 224H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5z"/>
                        </svg>
                    </p>
                    <p id="btnToStop_${vm.vmid}">
                    <svg width="13px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V256c0 17.7 14.3 32 32 32s32-14.3 32-32V32zM143.5 120.6c13.6-11.3 15.4-31.5 4.1-45.1s-31.5-15.4-45.1-4.1C49.7 115.4 16 181.8 16 256c0 132.5 107.5 240 240 240s240-107.5 240-240c0-74.2-33.8-140.6-86.6-184.6c-13.6-11.3-33.8-9.4-45.1 4.1s-9.4 33.8 4.1 45.1c38.9 32.3 63.5 81 63.5 135.4c0 97.2-78.8 176-176 176s-176-78.8-176-176c0-54.4 24.7-103.1 63.5-135.4z"/>
                    </svg>
                    </p>
                    <p id="btnForMaintenance_${vm.vmid}">
                    <svg width="13px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path d="M78.6 5C69.1-2.4 55.6-1.5 47 7L7 47c-8.5 8.5-9.4 22-2.1 31.6l80 104c4.5 5.9 11.6 9.4 19 9.4h54.1l109 109c-14.7 29-10 65.4 14.3 89.6l112 112c12.5 12.5 32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3l-112-112c-24.2-24.2-60.6-29-89.6-14.3l-109-109V104c0-7.5-3.5-14.5-9.4-19L78.6 5zM19.9 396.1C7.2 408.8 0 426.1 0 444.1C0 481.6 30.4 512 67.9 512c18 0 35.3-7.2 48-19.9L233.7 374.3c-7.8-20.9-9-43.6-3.6-65.1l-61.7-61.7L19.9 396.1zM512 144c0-10.5-1.1-20.7-3.2-30.5c-2.4-11.2-16.1-14.1-24.2-6l-63.9 63.9c-3 3-7.1 4.7-11.3 4.7H352c-8.8 0-16-7.2-16-16V102.6c0-4.2 1.7-8.3 4.7-11.3l63.9-63.9c8.1-8.1 5.2-21.8-6-24.2C388.7 1.1 378.5 0 368 0C288.5 0 224 64.5 224 144l0 .8 85.3 85.3c36-9.1 75.8 .5 104 28.7L429 274.5c49-23 83-72.8 83-130.5zM56 432a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z"/>
                    </svg>
                    </p>
                    <p id="btnForDisableMaintenance_${vm.vmid}" style="display:none;">
                    <svg width="13px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path d="M78.6 5C69.1-2.4 55.6-1.5 47 7L7 47c-8.5 8.5-9.4 22-2.1 31.6l80 104c4.5 5.9 11.6 9.4 19 9.4h54.1l109 109c-14.7 29-10 65.4 14.3 89.6l112 112c12.5 12.5 32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3l-112-112c-24.2-24.2-60.6-29-89.6-14.3l-109-109V104c0-7.5-3.5-14.5-9.4-19L78.6 5zM19.9 396.1C7.2 408.8 0 426.1 0 444.1C0 481.6 30.4 512 67.9 512c18 0 35.3-7.2 48-19.9L233.7 374.3c-7.8-20.9-9-43.6-3.6-65.1l-61.7-61.7L19.9 396.1zM512 144c0-10.5-1.1-20.7-3.2-30.5c-2.4-11.2-16.1-14.1-24.2-6l-63.9 63.9c-3 3-7.1 4.7-11.3 4.7H352c-8.8 0-16-7.2-16-16V102.6c0-4.2 1.7-8.3 4.7-11.3l63.9-63.9c8.1-8.1 5.2-21.8-6-24.2C388.7 1.1 378.5 0 368 0C288.5 0 224 64.5 224 144l0 .8 85.3 85.3c36-9.1 75.8 .5 104 28.7L429 274.5c49-23 83-72.8 83-130.5zM56 432a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z"/>
                    </svg>
                    </p>
                </div>
            </div>
            `;
        cell5.innerHTML = `<div class="table-cell">${vm.ip}</div>`;
            cell9.innerHTML = `<p id="audit_${vm.vmid}" class="runningButNotKFT" style="cursor: pointer;">Generate</p>`
            cell10.innerHTML = `<p id="error_${vm.vmid}" class="errorRedstatusPilsBanner" style="cursor: pointer;">Generate Log</p>`;
            cell11.innerHTML = '';

            const kftRunning = document.querySelectorAll(`[id^="btnForRunningVM_${vm.vmid}"]`);
            const kftReboot = document.querySelectorAll(`[id^="btnForReboot_${vm.vmid}"]`);
            const kftStopVm = document.querySelectorAll(`[id^="btnToStop_${vm.vmid}"]`);
            const kftMaintenanceVm = document.querySelectorAll(`[id^="btnForMaintenance_${vm.vmid}"]`);
            const kftDisableMaintenance = document.querySelectorAll(`[id^="btnForDisableMaintenance_${vm.vmid}"]`);
            
            // kftMaintenanceVm pour activer la maintenance

            kftMaintenanceVm.forEach(kftTools => {
                kftTools.onclick = function() {
                    popup.style.display = 'block';
                    popupContentText.innerHTML = `<h1>Put Maintenance on ${vm.vmid} ?</h1><br><p id="kftTools_${vm.vmid}" class="statusPils">Maintenance machine</p>`;
                    const kftToolsBtn = document.querySelectorAll(`[id^="kftTools_${vm.vmid}"]`);
                    kftToolsBtn.forEach(kftEnableTools => {
                        kftEnableTools.onclick = function() {
                            const apiUrlForEnableMaintenance = `http://int-proxmoxmonitor.eisge.com/ws/maintenance/HttpMaintainance/?node=${node}&vmid=${vm.vmid}&action=activate`;
                            localStorage.setItem(vm.vmid, 'Yes');
                            popupContentText.innerHTML = '<div class="loader"></div>';
                            fetch(apiUrlForEnableMaintenance)
                            .then(response => response.text())
                            .then(result => console.log(result))
                            .catch(error => console.error('Erreur lors de l\'envoi de la requête:', error)); // Gestion des erreurs
                            setTimeout(() => {
                                window.location.reload();
                            }, 3000);
                        }
                        
                        // Vérifier si la clé vm.vmid a la valeur "Yes" dans le localStorage
                    
                    });
                }
            });
            const maintenanceStatus = localStorage.getItem(vm.vmid);
            if (maintenanceStatus === 'Yes') {
                // Si oui, enlever la classe ${statusClass}
                const statusElement = document.getElementById(`btnStatus_${vm.vmid}`);
                const btnForMaintenance = document.getElementById(`btnForMaintenance_${vm.vmid}`);
                const btnForMaintenanceDisable = document.getElementById(`btnForDisableMaintenance_${vm.vmid}`);

                statusElement.classList.remove('statusPilsBanner');
                statusElement.classList.add('statusPilsBannerforMaintenance');
                btnForMaintenance.style.display = 'none';
                statusElement.innerText = 'Maintenance';
                btnForMaintenanceDisable.style.display = 'flex';
            }
            // kftDisableMaintenance Pour désactiver la maintenance
            kftDisableMaintenance.forEach(kftDisable => {
                kftDisable.onclick = function(){
                    popup.style.display = 'block';
                    popupContentText.innerHTML = `<h1>Disable Maintenance on ${vm.vmid} ?</h1><br><p id="disableMaintenance_${vm.vmid}" class="statusPils">Stop maintenance for the machine</p>`;
                    const kftBtnForDisable = document.querySelectorAll(`[id^="disableMaintenance_${vm.vmid}"]`);
                    kftBtnForDisable.forEach(kftBtnForDisableM => {
                        kftBtnForDisableM.onclick = function(){
                            const apiUrlForDisableMaintenance = `http://int-proxmoxmonitor.eisge.com/ws/maintenance/HttpMaintainance/?node=${node}&vmid=${vm.vmid}&action=deactivate`;
                            localStorage.setItem(vm.vmid, 'No');
                            popupContentText.innerHTML = '<div class="loader"></div>';
                            fetch(apiUrlForDisableMaintenance)
                            .then(response => response.text())
                            .then(result => console.log(result))
                            .catch(error => console.error('Erreur lors de l\'envoi de la requête:', error)); // Gestion des erreurs
                            setTimeout(() => {
                                window.location.reload();
                            }, 3000);
                        }
                    })
                }
            })
            if (maintenanceStatus === 'No'){
                const statusElement = document.getElementById(`btnStatus_${vm.vmid}`);
                const btnForMaintenance = document.getElementById(`btnForMaintenance_${vm.vmid}`);
                const btnForMaintenanceDisable = document.getElementById(`btnForDisableMaintenance_${vm.vmid}`);

                statusElement.classList.add('statusPilsBanner');
                statusElement.classList.remove('statusPilsBannerforMaintenance');
                btnForMaintenance.style.display = 'flex';
                statusElement.innerText = 'running'
                btnForMaintenanceDisable.style.display = 'none';
            }
            kftStopVm.forEach(kftStop => {
                kftStop.onclick = function(){
                    popup.style.display = 'block';
                    popupContentText.innerHTML = `<h1>Stop ${vm.vmid} ?</h1><br><p id="turnoff_${vm.vmid}" class="statusPils">Stop machine</p>`;

                    const kftTurnOff = document.querySelectorAll(`[id^="turnoff_${vm.vmid}"]`);
                    const apiUrlForTurnOFF = `http://int-proxmoxmonitor.eisge.com/ws/hyperviseur/stopLxc/?node=${node}&vmid=${vm.vmid}`;
            
                    kftTurnOff.forEach(kftOff => {
                        kftOff.onclick = function(){
                            console.log('ok');
                            const requestOptions = {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded' 
                                },
                                body: new URLSearchParams(), 
                            };
                            popupContentText.innerHTML = '<div class="loader"></div>';
                            fetch(apiUrlForTurnOFF, requestOptions)
                            .then(response => response.text())
                            .then(result => console.log(result))
                            .catch(error => console.error('Erreur lors de l\'envoi de la requête:', error)); // Gestion des erreurs
                            setTimeout(() => {
                                forceRefresh();
                            }, 3000);
                        };
                    });
                }
            });

            kftReboot.forEach(kftRebootVM => {
                kftRebootVM.onclick = function(){
                    popup.style.display = 'block';
                    popupContentText.innerHTML = `<h1>Reboot ${vm.vmid} ?</h1><br><p id="kftReboot_${vm.vmid}" class="statusPils">Reboot machine</p>`;

                    const kftReboot = document.querySelectorAll(`[id^="kftReboot_${vm.vmid}"]`);
                    const apiForReboot = `http://int-proxmoxmonitor.eisge.com/ws/hyperviseur/rebootLXC/?node=${node}&vmid=${vm.vmid}`;
                    kftReboot.forEach(kftRebootVm =>{
                        kftRebootVm.onclick = function(){
                            const requestOptions = {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded' 
                                },
                                body: new URLSearchParams(), 
                            };
                            popupContentText.innerHTML = '<div class="loader"></div>';
                            fetch(apiForReboot, requestOptions)
                            .then(response => response.text())
                            .then(result => console.log(result))
                            .catch(error => console.error('Erreur lors de l\'envoi de la requête:', error)); // Gestion des erreurs
                            setTimeout(() => {
                                forceRefresh();
                            }, 3000);
                        };
                    })
                }
            })
            kftRunning.forEach(kftRun => {
                kftRun.onclick = function() {
                    popup.style.display = 'block';
                    popupContentText.innerHTML = `<h1>Run ${vm.vmid} ?</h1><br><p id="turnon_${vm.vmid}" class="statusPils">Start machine</p>`;
                    const kftTurnOn = document.querySelectorAll(`[id^="turnon_${vm.vmid}"]`);
                    const apiUrlForTurnOn = `http://int-proxmoxadmin.eisge.com/ws/hyperviseur/startlxc/?node=${node}&vmid=${vm.vmid}`;
            
                    kftTurnOn.forEach(kftOn => {
                        kftOn.onclick = function(){
                            console.log('ok run' + vm.vmid);
                            const requestOptions = {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded' 
                                },
                                body: new URLSearchParams(), 
                            };

                            popupContentText.innerHTML = '<div class="loader"></div>';
                            fetch(apiUrlForTurnOn, requestOptions)
                            .then(response => response.text())  
                            .then(result => console.log(result))
                            .catch(error => console.error('Erreur lors de l\'envoi de la requête:', error)); // Gestion des erreurs
                            setTimeout(() => {
                                forceRefresh();
                            }, 3000);
                        };
                    });
                };
            });
            const kftMaintenance = document.querySelectorAll(`[id^="btnStatus_${vm.vmid}"]`);
            const kftRolls = document.querySelectorAll(`[id^="roll_${vm.vmid}"]`);
            const checkbox = document.getElementById(`check_${vm.vmid}`);
            const kftErrors = document.querySelectorAll(`[id^="error_${vm.vmid}"]`);

          
            if (vm.status === "stopped") {
                cell0.innerHTML = '';
                cell1.innerHTML = ``;
                cell2.innerHTML = `<div id="selectedHostnamesDisplay" class="table-cell selected_${vm.vmid}">${vm.hostname}</div>`;
                cell3.innerHTML = `<div class="table-cell">${vm.vmid}</div>`;
                cell4.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; margin-left: -24px;">
                    <div id="btnStatus_${vm.vmid}" class="table-cell ${statusClass}">${vm.status}</div> 
                    <div style="display: flex; align-items: center; gap: 15px; margin-left:10px;">
                        <p id="btnForRunningVM_${vm.vmid}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="11px" viewBox="0 0 384 512">
                                <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/>
                            </svg>
                        </p>
                        <p id="btnForMaintenance_${vm.vmid}">
                        <svg width="13px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path d="M78.6 5C69.1-2.4 55.6-1.5 47 7L7 47c-8.5 8.5-9.4 22-2.1 31.6l80 104c4.5 5.9 11.6 9.4 19 9.4h54.1l109 109c-14.7 29-10 65.4 14.3 89.6l112 112c12.5 12.5 32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3l-112-112c-24.2-24.2-60.6-29-89.6-14.3l-109-109V104c0-7.5-3.5-14.5-9.4-19L78.6 5zM19.9 396.1C7.2 408.8 0 426.1 0 444.1C0 481.6 30.4 512 67.9 512c18 0 35.3-7.2 48-19.9L233.7 374.3c-7.8-20.9-9-43.6-3.6-65.1l-61.7-61.7L19.9 396.1zM512 144c0-10.5-1.1-20.7-3.2-30.5c-2.4-11.2-16.1-14.1-24.2-6l-63.9 63.9c-3 3-7.1 4.7-11.3 4.7H352c-8.8 0-16-7.2-16-16V102.6c0-4.2 1.7-8.3 4.7-11.3l63.9-63.9c8.1-8.1 5.2-21.8-6-24.2C388.7 1.1 378.5 0 368 0C288.5 0 224 64.5 224 144l0 .8 85.3 85.3c36-9.1 75.8 .5 104 28.7L429 274.5c49-23 83-72.8 83-130.5zM56 432a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z"/>
                        </svg>
                        </p>
                        <p id="btnForDisableMaintenance_${vm.vmid}" style="display:none;">
                        <svg width="13px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path d="M78.6 5C69.1-2.4 55.6-1.5 47 7L7 47c-8.5 8.5-9.4 22-2.1 31.6l80 104c4.5 5.9 11.6 9.4 19 9.4h54.1l109 109c-14.7 29-10 65.4 14.3 89.6l112 112c12.5 12.5 32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3l-112-112c-24.2-24.2-60.6-29-89.6-14.3l-109-109V104c0-7.5-3.5-14.5-9.4-19L78.6 5zM19.9 396.1C7.2 408.8 0 426.1 0 444.1C0 481.6 30.4 512 67.9 512c18 0 35.3-7.2 48-19.9L233.7 374.3c-7.8-20.9-9-43.6-3.6-65.1l-61.7-61.7L19.9 396.1zM512 144c0-10.5-1.1-20.7-3.2-30.5c-2.4-11.2-16.1-14.1-24.2-6l-63.9 63.9c-3 3-7.1 4.7-11.3 4.7H352c-8.8 0-16-7.2-16-16V102.6c0-4.2 1.7-8.3 4.7-11.3l63.9-63.9c8.1-8.1 5.2-21.8-6-24.2C388.7 1.1 378.5 0 368 0C288.5 0 224 64.5 224 144l0 .8 85.3 85.3c36-9.1 75.8 .5 104 28.7L429 274.5c49-23 83-72.8 83-130.5zM56 432a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z"/>
                        </svg>
                        </p>
                    </div>
                </div>
                `;    
                cell5.innerHTML = `<div class="table-cell">${vm.ip}</div>`;
                cell9.innerHTML = ``;
                cell10.innerHTML ='';
                cell11.innerHTML = '';

                const kftRunning = document.querySelectorAll(`[id^="btnForRunningVM_${vm.vmid}"]`);
                const kftReboot = document.querySelectorAll(`[id^="btnForReboot_${vm.vmid}"]`);
                const kftStopVm = document.querySelectorAll(`[id^="btnToStop_${vm.vmid}"]`);
                const kftMaintenanceVm = document.querySelectorAll(`[id^="btnForMaintenance_${vm.vmid}"]`);
                const kftDisableMaintenance = document.querySelectorAll(`[id^="btnForDisableMaintenance_${vm.vmid}"]`);
                
                // kftMaintenanceVm pour activer la maintenance

                kftMaintenanceVm.forEach(kftTools => {
                    kftTools.onclick = function() {
                        popup.style.display = 'block';
                        popupContentText.innerHTML = `<h1>Put Maintenance on ${vm.vmid} ?</h1><br><p id="kftTools_${vm.vmid}" class="statusPils">Maintenance machine</p>`;
                        const kftToolsBtn = document.querySelectorAll(`[id^="kftTools_${vm.vmid}"]`);
                        kftToolsBtn.forEach(kftEnableTools => {
                            kftEnableTools.onclick = function() {
                                const apiUrlForEnableMaintenance = `http://int-proxmoxmonitor.eisge.com/ws/maintenance/HttpMaintainance/?node=${node}&vmid=${vm.vmid}&action=activate`;
                                localStorage.setItem(vm.vmid, 'Yes');
                                popupContentText.innerHTML = '<div class="loader"></div>';
                                fetch(apiUrlForEnableMaintenance)
                                .then(response => response.text())
                                .then(result => console.log(result))
                                .catch(error => console.error('Erreur lors de l\'envoi de la requête:', error)); // Gestion des erreurs
                                setTimeout(() => {
                                    window.location.reload();
                                }, 3000);
                            }
                            
                            // Vérifier si la clé vm.vmid a la valeur "Yes" dans le localStorage
                        
                        });
                    }
                });
                const maintenanceStatus = localStorage.getItem(vm.vmid);
                if (maintenanceStatus === 'Yes') {
                    // Si oui, enlever la classe ${statusClass}
                    const statusElement = document.getElementById(`btnStatus_${vm.vmid}`);
                    const btnForMaintenance = document.getElementById(`btnForMaintenance_${vm.vmid}`);
                    const btnForMaintenanceDisable = document.getElementById(`btnForDisableMaintenance_${vm.vmid}`);

                    statusElement.classList.remove('statusPilsBanner');
                    statusElement.classList.add('statusPilsBannerforMaintenance');
                    btnForMaintenance.style.display = 'none';
                    statusElement.innerText = 'Maintenance'
                    btnForMaintenanceDisable.style.display = 'flex';
                }
                // kftDisableMaintenance Pour désactiver la maintenance
                kftDisableMaintenance.forEach(kftDisable => {
                    kftDisable.onclick = function(){
                        popup.style.display = 'block';
                        popupContentText.innerHTML = `<h1>Disable Maintenance on ${vm.vmid} ?</h1><br><p id="disableMaintenance_${vm.vmid}" class="statusPils">Stop maintenance for the machine</p>`;
                        const kftBtnForDisable = document.querySelectorAll(`[id^="disableMaintenance_${vm.vmid}"]`);
                        kftBtnForDisable.forEach(kftBtnForDisableM => {
                            kftBtnForDisableM.onclick = function(){
                                const apiUrlForDisableMaintenance = `http://int-proxmoxmonitor.eisge.com/ws/maintenance/HttpMaintainance/?node=${node}&vmid=${vm.vmid}&action=deactivate`;
                                localStorage.setItem(vm.vmid, 'No');
                                popupContentText.innerHTML = '<div class="loader"></div>';
                                fetch(apiUrlForDisableMaintenance)
                                .then(response => response.text())
                                .then(result => console.log(result))
                                .catch(error => console.error('Erreur lors de l\'envoi de la requête:', error)); // Gestion des erreurs
                                setTimeout(() => {
                                    window.location.reload();
                                }, 3000);
                            }
                        })
                    }
                })
                if (maintenanceStatus === 'No'){
                    const statusElement = document.getElementById(`btnStatus_${vm.vmid}`);
                    const btnForMaintenance = document.getElementById(`btnForMaintenance_${vm.vmid}`);
                    const btnForMaintenanceDisable = document.getElementById(`btnForDisableMaintenance_${vm.vmid}`);

                    statusElement.classList.add('statusPilsBanner');
                    statusElement.classList.remove('statusPilsBannerforMaintenance');
                    btnForMaintenance.style.display = 'flex';
                    statusElement.innerText = 'running'
                    btnForMaintenanceDisable.style.display = 'none';
                }
                kftStopVm.forEach(kftStop => {
                    kftStop.onclick = function(){
                        popup.style.display = 'block';
                        popupContentText.innerHTML = `<h1>Stop ${vm.vmid} ?</h1><br><p id="turnoff_${vm.vmid}" class="statusPils">Stop machine</p>`;

                        const kftTurnOff = document.querySelectorAll(`[id^="turnoff_${vm.vmid}"]`);
                        const apiUrlForTurnOFF = `http://int-proxmoxmonitor.eisge.com/ws/hyperviseur/stopLxc/?node=${node}&vmid=${vm.vmid}`;
                
                        kftTurnOff.forEach(kftOff => {
                            kftOff.onclick = function(){
                                console.log('ok');
                                const requestOptions = {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/x-www-form-urlencoded' 
                                    },
                                    body: new URLSearchParams(), 
                                };
                                popupContentText.innerHTML = '<div class="loader"></div>';
                                fetch(apiUrlForTurnOFF, requestOptions)
                                .then(response => response.text())
                                .then(result => console.log(result))
                                .catch(error => console.error('Erreur lors de l\'envoi de la requête:', error)); // Gestion des erreurs
                                setTimeout(() => {
                                    forceRefresh();
                                }, 3000);
                            };
                        });
                    }
                });

                kftReboot.forEach(kftRebootVM => {
                    kftRebootVM.onclick = function(){
                        popup.style.display = 'block';
                        popupContentText.innerHTML = `<h1>Reboot ${vm.vmid} ?</h1><br><p id="kftReboot_${vm.vmid}" class="statusPils">Reboot machine</p>`;

                        const kftReboot = document.querySelectorAll(`[id^="kftReboot_${vm.vmid}"]`);
                        const apiForReboot = `http://int-proxmoxmonitor.eisge.com/ws/hyperviseur/rebootLXC/?node=${node}&vmid=${vm.vmid}`;
                        kftReboot.forEach(kftRebootVm =>{
                            kftRebootVm.onclick = function(){
                                const requestOptions = {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/x-www-form-urlencoded' 
                                    },
                                    body: new URLSearchParams(), 
                                };
                                popupContentText.innerHTML = '<div class="loader"></div>';
                                fetch(apiForReboot, requestOptions)
                                .then(response => response.text())
                                .then(result => console.log(result))
                                .catch(error => console.error('Erreur lors de l\'envoi de la requête:', error)); // Gestion des erreurs
                                setTimeout(() => {
                                    forceRefresh();
                                }, 3000);
                            };
                        })
                    }
                })
                kftRunning.forEach(kftRun => {
                    kftRun.onclick = function() {
                        popup.style.display = 'block';
                        popupContentText.innerHTML = `<h1>Run ${vm.vmid} ?</h1><br><p id="turnon_${vm.vmid}" class="statusPils">Start machine</p>`;
                        const kftTurnOn = document.querySelectorAll(`[id^="turnon_${vm.vmid}"]`);
                        const apiUrlForTurnOn = `http://int-proxmoxadmin.eisge.com/ws/hyperviseur/startlxc/?node=${node}&vmid=${vm.vmid}`;
                
                        kftTurnOn.forEach(kftOn => {
                            kftOn.onclick = function(){
                                console.log('ok run' + vm.vmid);
                                const requestOptions = {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/x-www-form-urlencoded' 
                                    },
                                    body: new URLSearchParams(), 
                                };

                                popupContentText.innerHTML = '<div class="loader"></div>';
                                fetch(apiUrlForTurnOn, requestOptions)
                                .then(response => response.text())  
                                .then(result => console.log(result))
                                .catch(error => console.error('Erreur lors de l\'envoi de la requête:', error)); // Gestion des erreurs
                                setTimeout(() => {
                                    forceRefresh();
                                }, 3000);
                            };
                        });
                    };
                });
    
            } else {
              
            }
    
            
            applyPatch.addEventListener('click', function() {
                if (checkbox.checked) {

                    const fileSQL = document.getElementById('sqlForm');
                    var fileInput = document.getElementById('sqlFileInput');
                    var file = fileInput.files[0];

                    fileSQL.setAttribute('class', 'tptp');

                    if (!file) {

                        alert("Veuillez sélectionner un fichier SQL.");
                        return;

                    }
                    var formData = new FormData();
                    formData.append('sqlsupport', file);

                    var baseApiUrl = 'http://int-proxmoxmonitor.eisge.com/ws/hyperviseur/updateKFTvm?';
                    
                    var paramsList = [{ node:  `${node}`, vmid: `${vm.vmid}` }];

                    popup.style.display = 'block';

                    Promise.all(paramsList.map(params => {

                        var apiUrl = baseApiUrl + new URLSearchParams(params);
                        return fetch(apiUrl, {
                            method: 'POST',
                            body: formData
                        })

                        .then(response => {
                            if (response.ok) {
                                return response.json();
                            } else {
                                throw new Error("Erreur lors de l'application du patch :" + response.statusText);
                            }
                        });
                    }))

                    .then(responses => {
                        var messagesHTML = responses.map(response => response.data.message).join("<br><br>");
                        popupContentText.innerHTML += `<b>${vm.hostname}</b> :  ` + messagesHTML + '<br><br>';

                    })
                    .catch(error => {
                        console.error(error);
                        popupContentText.innerHTML = "Une erreur s'est produite lors de l'application du patch.";
                    });
                }
            });
            
                kftErrors.forEach(kftError => {
                    kftError.onclick = function() {
                        popup.style.display = 'block';
                        popupContentText.innerHTML = '<p>Generating Logs</p><br><div class="loader"></div>';
                        const vmid = this.id.replace('error_', '');

                        console.log("Error log clicked for VM ID : ", vmid);

                        fetch(apiUrlForSpecificError)
                        .then(response => response.json())
                        .then(data => {
                            popupContentText.innerHTML = "";
                            popupContent.innerHTML+= `<h2>All errors for VM ${data.data.vmid}</h2>`;
                            popupContent.innerHTML += `<b>Error log content (size - ${data.data.error_log_size}) : <p class="error_log"> ${data.data.error_log_content}</b></p><br><b>Access log content (size - ${data.data.access_log_size}) : <p class="error_log"> ${data.data.access_log_content}</b></p>`;
                        })
                        .catch(error => {
                            console.error('Error fetching specific error:', error);
                        });
                    }
                   
                });
                

                kftRolls.forEach(kftRoll => {
                    kftRoll.onclick = function() {
                        popup.style.display = 'block';
                        popupContentText.innerHTML = '<div class="loader"></div>';
                        const vmid = this.id.replace('roll_', '');
                        
                        console.log("Rollback clicked for VM ID:", vmid);
                        fetch(apiUrlForRollback)
                        .then(response => response.json())
                        .then((data) => {
                        
                            popupContentText.innerHTML = `Version before rollback ${data.data.version_before_rollback} & version after rollback ${data.data.version_after_rollback} `;
                            console.log(data.kftversion);
                        })
                        .catch(error => {
                            console.log('Erreur lors de la récupération des données de l\'API spécifique à la VM:', error);
                        });     
                    };
                    
                    cell1.addEventListener('click', function() {

                        if (this.classList.contains(`selected_${vm.vmid}`)) {
                            this.classList.remove(`selected_${vm.vmid}`);
                        } else {
                            this.classList.add(`selected_${vm.vmid}`);
                        }

                        const selectedItems = document.querySelectorAll(`.table-cell.selected_${vm.vmid}`);
                        const selectedHostnames = Array.from(selectedItems).map(item => item.textContent.trim());
                        console.log(selectedHostnames);
                    });
                });
               

            const kftAudit = document.querySelectorAll(`[id^="audit_${vm.vmid}"]`);

            kftAudit.forEach(GenerateAudit => {  
                GenerateAudit.onclick = function() {
                    popup.style.display = 'block';
                    popupContentText.innerHTML = '<p><b>Generating Audit</b></p><br><div class="loader"></div>';
                    const vmid = this.id.replace('audit_', '');
                    console.log("Audit clicked for VM ID:", vmid);
                    fetch(apiUrlForAudit)
                    .then(response => response.json())
                    .then((data) => {
                        popupContentText.innerHTML = `Audit Generated.<br><br> MD5 : <b style="color:#B44444;">${data.data.md5}</b> <br><br> File url : <a style="color:black; text-decoration:none;" href="${data.data.url}" download="audit_vm_${vmid}">${data.data.url}</a>`;
                        console.log(data.kftversion);
                    })
                    .catch(error => {
                        console.log('Erreur lors de la récupération des données de l\'API spécifique à la VM:', error);
                    });                   
                };
            });

          const apiUrlForSpecificVM = `http://int-proxmoxmonitor.eisge.com/ws/hyperviseur/getKFTInformation?node=${node}&vmid=${vm.vmid}`;
          const apiUrlForSpecificError = `http://int-proxmoxmonitor.eisge.com/ws/hyperviseur/getUniqueVmErrors?node=${node}&vmid=${vm.vmid}`;

          if (vm.status === 'running') {
            const vmDataKey = `${node}_vm_${vm.vmid}`;
            const storedData = getDataFromLocalStorage(vmDataKey);
        
            if (storedData) {
                // Si les données sont disponibles dans le stockage local
                cell6.innerHTML = `<div class="table-cell">${storedData.Subject_number}</div>`;
                cell7.innerHTML = `<div class="table-cell">${storedData.Execution_number}</div>`;
                cell8.innerHTML = `<div class="table-cell">${storedData.version}</div>`;
                cell0.innerHTML = ``;
                if (storedData.version >= "202403") {
                    cell8.innerHTML = `<p class="blueVM">${storedData.version}</p>`;
                }
                if (storedData.version <= "20240227") {
                    cell8.innerHTML = `<p class="statusPilsBanner">${storedData.version}</p>`;
                }
                if (storedData.version <= "20240206") {
                    cell8.innerHTML = `<p class="yellowVM">${storedData.version}</p>`;
                }
                if (storedData.version <= "20231214") {
                    cell8.innerHTML = `<p class="darkVM">$${storedData.version}}</p>`;
                }
                if (storedData.version === "2023121501") {
                    cell8.innerHTML = `<p class="darkVM">${storedData.version}</p>`;
                }
            } else {
                // Si les données ne sont pas disponibles dans le stockage local, les récupérer via fetch
                fetch(apiUrlForSpecificVM)
                    .then(response => response.json())
                    .then(data => {
                        if (data.data.version !== undefined && data.data.version !== "") {
                            storeDataInLocalStorage(vmDataKey, data.data);
                            cell6.innerHTML = `<div class="table-cell">${data.data.Subject_number}</div>`;
                            cell7.innerHTML = `<div class="table-cell">${data.data.Execution_number}</div>`;
                            cell8.innerHTML = `<div class="table-cell">${data.data.version}</div>`;
                            cell0.innerHTML = ``;
                            if (data.data.version >= "202403") {
                                cell8.innerHTML = `<p class="blueVM">${data.data.version}</p>`;
                            }
                            if (data.data.version <= "20240227") {
                                cell8.innerHTML = `<p class="statusPilsBanner">${data.data.version}</p>`;
                            }
                            if (data.data.version <= "20240206") {
                                cell8.innerHTML = `<p class="yellowVM">${data.data.version}</p>`;
                            }
                            if (data.data.version <= "20231214") {
                                cell8.innerHTML = `<p class="darkVM">${data.data.version}</p>`;
                            }
                            if (data.data.version === "2023121501") {
                                cell8.innerHTML = `<p class="darkVM">${data.data.version}</p>`;
                            }
                           
                        } else {
                            // Gérer le cas où les données n'existent pas ou ne sont pas valides
                            cell0.innerHTML = '';
                            cell1.innerHTML = ``;
                            cell2.innerHTML = `<div id="selectedHostnamesDisplay" class="table-cell selected_${vm.vmid}">${vm.hostname}</div>`;
                            cell3.innerHTML = `<div class="table-cell">${vm.vmid}</div>`;
                            cell4.innerHTML = `
                                <div style="display: flex; justify-content: center; align-items: center; -2px">
                                    <div id="btnStatus_${vm.vmid}" class="table-cell ${statusClass}">${vm.status}</div> 
                                    <div style="display: flex; align-items: center; gap: 15px; margin-left: 10px; cursor: pointer;">
                                        <p id="btnForReboot_${vm.vmid}">
                                            <svg width="13px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                                <path d="M463.5 224H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5z"/>
                                            </svg>
                                        </p>
                                        <p id="btnToStop_${vm.vmid}">
                                        <svg width="13px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                            <path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V256c0 17.7 14.3 32 32 32s32-14.3 32-32V32zM143.5 120.6c13.6-11.3 15.4-31.5 4.1-45.1s-31.5-15.4-45.1-4.1C49.7 115.4 16 181.8 16 256c0 132.5 107.5 240 240 240s240-107.5 240-240c0-74.2-33.8-140.6-86.6-184.6c-13.6-11.3-33.8-9.4-45.1 4.1s-9.4 33.8 4.1 45.1c38.9 32.3 63.5 81 63.5 135.4c0 97.2-78.8 176-176 176s-176-78.8-176-176c0-54.4 24.7-103.1 63.5-135.4z"/>
                                        </svg>
                                        </p>
                                        <p id="btnForMaintenance_${vm.vmid}">
                                        <svg width="13px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                            <path d="M78.6 5C69.1-2.4 55.6-1.5 47 7L7 47c-8.5 8.5-9.4 22-2.1 31.6l80 104c4.5 5.9 11.6 9.4 19 9.4h54.1l109 109c-14.7 29-10 65.4 14.3 89.6l112 112c12.5 12.5 32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3l-112-112c-24.2-24.2-60.6-29-89.6-14.3l-109-109V104c0-7.5-3.5-14.5-9.4-19L78.6 5zM19.9 396.1C7.2 408.8 0 426.1 0 444.1C0 481.6 30.4 512 67.9 512c18 0 35.3-7.2 48-19.9L233.7 374.3c-7.8-20.9-9-43.6-3.6-65.1l-61.7-61.7L19.9 396.1zM512 144c0-10.5-1.1-20.7-3.2-30.5c-2.4-11.2-16.1-14.1-24.2-6l-63.9 63.9c-3 3-7.1 4.7-11.3 4.7H352c-8.8 0-16-7.2-16-16V102.6c0-4.2 1.7-8.3 4.7-11.3l63.9-63.9c8.1-8.1 5.2-21.8-6-24.2C388.7 1.1 378.5 0 368 0C288.5 0 224 64.5 224 144l0 .8 85.3 85.3c36-9.1 75.8 .5 104 28.7L429 274.5c49-23 83-72.8 83-130.5zM56 432a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z"/>
                                        </svg>
                                        </p>
                                        <p id="btnForDisableMaintenance_${vm.vmid}" style="display:none;">
                                        <svg width="13px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                            <path d="M78.6 5C69.1-2.4 55.6-1.5 47 7L7 47c-8.5 8.5-9.4 22-2.1 31.6l80 104c4.5 5.9 11.6 9.4 19 9.4h54.1l109 109c-14.7 29-10 65.4 14.3 89.6l112 112c12.5 12.5 32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3l-112-112c-24.2-24.2-60.6-29-89.6-14.3l-109-109V104c0-7.5-3.5-14.5-9.4-19L78.6 5zM19.9 396.1C7.2 408.8 0 426.1 0 444.1C0 481.6 30.4 512 67.9 512c18 0 35.3-7.2 48-19.9L233.7 374.3c-7.8-20.9-9-43.6-3.6-65.1l-61.7-61.7L19.9 396.1zM512 144c0-10.5-1.1-20.7-3.2-30.5c-2.4-11.2-16.1-14.1-24.2-6l-63.9 63.9c-3 3-7.1 4.7-11.3 4.7H352c-8.8 0-16-7.2-16-16V102.6c0-4.2 1.7-8.3 4.7-11.3l63.9-63.9c8.1-8.1 5.2-21.8-6-24.2C388.7 1.1 378.5 0 368 0C288.5 0 224 64.5 224 144l0 .8 85.3 85.3c36-9.1 75.8 .5 104 28.7L429 274.5c49-23 83-72.8 83-130.5zM56 432a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z"/>
                                        </svg>
                                        </p>
                                    </div>
                                </div>
                            `;
                
                            cell5.innerHTML = `<div id="btnStatus_${vm.vmid}" class="table-cell">${vm.ip}</div>`;
                            cell8.innerHTML =  `<p class="${vm.status}_noKFT, noKFT">Not a KFT VM</p>`;
                            cell9.innerHTML = ``;
                            cell10.innerHTML ='';
                            const kftRunning = document.querySelectorAll(`[id^="btnForRunningVM_${vm.vmid}"]`);
                            const kftReboot = document.querySelectorAll(`[id^="btnForReboot_${vm.vmid}"]`);
                            const kftStopVm = document.querySelectorAll(`[id^="btnToStop_${vm.vmid}"]`);
                            const kftMaintenanceVm = document.querySelectorAll(`[id^="btnForMaintenance_${vm.vmid}"]`);
                            const kftDisableMaintenance = document.querySelectorAll(`[id^="btnForDisableMaintenance_${vm.vmid}"]`);
                            
                            // kftMaintenanceVm pour activer la maintenance

                            kftMaintenanceVm.forEach(kftTools => {
                                kftTools.onclick = function() {
                                    popup.style.display = 'block';
                                    popupContentText.innerHTML = `<h1>Put Maintenance on ${vm.vmid} ?</h1><br><p id="kftTools_${vm.vmid}" class="statusPils">Maintenance machine</p>`;
                                    const kftToolsBtn = document.querySelectorAll(`[id^="kftTools_${vm.vmid}"]`);
                                    kftToolsBtn.forEach(kftEnableTools => {
                                        kftEnableTools.onclick = function() {
                                            const apiUrlForEnableMaintenance = `http://int-proxmoxadmin.eisge.com/ws/maintenance/HttpMaintainance/?node=${node}&vmid=${vm.vmid}&action=activate`;
                                            localStorage.setItem(vm.vmid, 'Yes');
                                            popupContentText.innerHTML = '<div class="loader"></div>';
                                            fetch(apiUrlForEnableMaintenance)
                                            .then(response => response.text())
                                            .then(result => console.log(result))
                                            .catch(error => console.error('Erreur lors de l\'envoi de la requête:', error)); // Gestion des erreurs
                                            setTimeout(() => {
                                                window.location.reload();
                                            }, 3000);
                                        }
                                        
                                        // Vérifier si la clé vm.vmid a la valeur "Yes" dans le localStorage
                                    
                                    });
                                }
                            });
                            const maintenanceStatus = localStorage.getItem(vm.vmid);
                            if (maintenanceStatus === 'Yes') {
                                // Si oui, enlever la classe ${statusClass}
                                const statusElement = document.getElementById(`btnStatus_${vm.vmid}`);
                                const btnForMaintenance = document.getElementById(`btnForMaintenance_${vm.vmid}`);
                                const btnForMaintenanceDisable = document.getElementById(`btnForDisableMaintenance_${vm.vmid}`);

                                statusElement.classList.remove('statusPilsBanner');
                                statusElement.classList.add('statusPilsBannerforMaintenance');
                                btnForMaintenance.style.display = 'none';
                                statusElement.innerText = 'Maintenance'
                                btnForMaintenanceDisable.style.display = 'flex';
                            }
                            // kftDisableMaintenance Pour désactiver la maintenance
                            kftDisableMaintenance.forEach(kftDisable => {
                                kftDisable.onclick = function(){
                                    popup.style.display = 'block';
                                    popupContentText.innerHTML = `<h1>Disable Maintenance on ${vm.vmid} ?</h1><br><p id="disableMaintenance_${vm.vmid}" class="statusPils">Stop maintenance for the machine</p>`;
                                    const kftBtnForDisable = document.querySelectorAll(`[id^="disableMaintenance_${vm.vmid}"]`);
                                    kftBtnForDisable.forEach(kftBtnForDisableM => {
                                        kftBtnForDisableM.onclick = function(){
                                            const apiUrlForDisableMaintenance = `http://int-proxmoxadmin.eisge.com/ws/maintenance/HttpMaintainance/?node=${node}&vmid=${vm.vmid}&action=deactivate`;
                                            localStorage.setItem(vm.vmid, 'No');
                                            popupContentText.innerHTML = '<div class="loader"></div>';
                                            fetch(apiUrlForDisableMaintenance)
                                            .then(response => response.text())
                                            .then(result => console.log(result))
                                            .catch(error => console.error('Erreur lors de l\'envoi de la requête:', error)); // Gestion des erreurs
                                            setTimeout(() => {
                                                window.location.reload();
                                            }, 3000);
                                        }
                                    })
                                }
                            })
                            if (maintenanceStatus === 'No'){
                                const statusElement = document.getElementById(`btnStatus_${vm.vmid}`);
                                const btnForMaintenance = document.getElementById(`btnForMaintenance_${vm.vmid}`);
                                const btnForMaintenanceDisable = document.getElementById(`btnForDisableMaintenance_${vm.vmid}`);

                                statusElement.classList.add('statusPilsBanner');
                                statusElement.classList.remove('statusPilsBannerforMaintenance');
                                btnForMaintenance.style.display = 'flex';
                                statusElement.innerText = 'running'
                                btnForMaintenanceDisable.style.display = 'none';
                            }
                            kftStopVm.forEach(kftStop => {
                                kftStop.onclick = function(){
                                    popup.style.display = 'block';
                                    popupContentText.innerHTML = `<h1>Stop ${vm.vmid} ?</h1><br><p id="turnoff_${vm.vmid}" class="statusPils">Stop machine</p>`;
            
                                    const kftTurnOff = document.querySelectorAll(`[id^="turnoff_${vm.vmid}"]`);
                                    const apiUrlForTurnOFF = `http://int-proxmoxadmin.eisge.com/ws/hyperviseur/stopLxc/?node=${node}&vmid=${vm.vmid}`;
                            
                                    kftTurnOff.forEach(kftOff => {
                                        kftOff.onclick = function(){
                                            console.log('ok');
                                            const requestOptions = {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/x-www-form-urlencoded' 
                                                },
                                                body: new URLSearchParams(), 
                                            };
                                            popupContentText.innerHTML = '<div class="loader"></div>';
                                            fetch(apiUrlForTurnOFF, requestOptions)
                                            .then(response => response.text())
                                            .then(result => console.log(result))
                                            .catch(error => console.error('Erreur lors de l\'envoi de la requête:', error)); // Gestion des erreurs
                                            setTimeout(() => {
                                                forceRefresh();
                                            }, 3000);
                                        };
                                    });
                                }
                            });
            
                            kftReboot.forEach(kftRebootVM => {
                                kftRebootVM.onclick = function(){
                                    popup.style.display = 'block';
                                    popupContentText.innerHTML = `<h1>Reboot ${vm.vmid} ?</h1><br><p id="kftReboot_${vm.vmid}" class="statusPils">Reboot machine</p>`;

                                    const kftReboot = document.querySelectorAll(`[id^="kftReboot_${vm.vmid}"]`);
                                    const apiForReboot = `http://int-proxmoxadmin.eisge.com/ws/hyperviseur/rebootLXC/?node=${node}&vmid=${vm.vmid}`;
                                    kftReboot.forEach(kftRebootVm =>{
                                        kftRebootVm.onclick = function(){
                                            const requestOptions = {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/x-www-form-urlencoded' 
                                                },
                                                body: new URLSearchParams(), 
                                            };
                                            popupContentText.innerHTML = '<div class="loader"></div>';
                                            fetch(apiForReboot, requestOptions)
                                            .then(response => response.text())
                                            .then(result => console.log(result))
                                            .catch(error => console.error('Erreur lors de l\'envoi de la requête:', error)); // Gestion des erreurs
                                            setTimeout(() => {
                                                forceRefresh();
                                            }, 3000);
                                        };
                                    })
                                }
                            });
                            kftRunning.forEach(kftRun => {
                                kftRun.onclick = function() {
                                    popup.style.display = 'block';
                                    popupContentText.innerHTML = `<h1>Run ${vm.vmid} ?</h1><br><p id="turnon_${vm.vmid}" class="statusPils">Start machine</p>`;
                                    const kftTurnOn = document.querySelectorAll(`[id^="turnon_${vm.vmid}"]`);
                                    const apiUrlForTurnOn = `http://int-proxmoxadmin.eisge.com/ws/hyperviseur/startlxc/?node=${node}&vmid=${vm.vmid}`;
                            
                                    kftTurnOn.forEach(kftOn => {
                                        kftOn.onclick = function(){
                                            console.log('ok run' + vm.vmid);
                                            const requestOptions = {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/x-www-form-urlencoded' 
                                                },
                                                body: new URLSearchParams(), 
                                            };
            
                                            popupContentText.innerHTML = '<div class="loader"></div>';
                                            fetch(apiUrlForTurnOn, requestOptions)
                                            .then(response => response.text())  
                                            .then(result => console.log(result))
                                            .catch(error => console.error('Erreur lors de l\'envoi de la requête:', error)); // Gestion des erreurs
                                            setTimeout(() => {
                                                forceRefresh();
                                            }, 3000);
                                        };
                                    });
                                };
                            });
                            
                        }                       
                    })
                    .catch(error => {
                        console.error('Error fetching specific VM:', error);
                    });
            }
            
        }
             fetch(apiUrlForSpecificError)
             .then(response => response.json())
             .then(data => {
                if (data.data.error_log_size && data.data.access_log_size) {
                    cell11.innerHTML = `<p id="errorSize_${vm.vmid}" class="errorRedstatusPilsBanner">${data.data.error_log_size} Error log size</p>
                    <p id="errorSize_${vm.vmid}" class="errorRedstatusPilsBanner">${data.data.access_log_size} Access log size</p>`;
                } else {
                    cell11.innerHTML = '';
                }
                 
             })
             .catch(error => {
                 console.error('Error fetching specific error:', error);
             });
   
        });
        
    }
});

const popup = document.getElementById('popup');

function closePopup() {
    popup.style.display = 'none';
}

function forceRefresh(){

    console.log('tata');
    const refreshAction = document.querySelector('.refresh');
    refreshAction.classList.add('rotate-animation');
    localStorage.clear();

     setTimeout(() => {
        refreshAction.classList.remove('rotate-animation');
        window.location.reload();
    }, 1000);

}

