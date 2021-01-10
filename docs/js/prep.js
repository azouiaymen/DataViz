
$(document).ready(function () {
    var polluants = ["pm25", "mp10", "o3", "no2"];
    polluants.forEach(function (pollu) {
        $("#polluantContainer").append(`<option id="pollu-${pollu}" value="${pollu}">${pollu}</option>`)
    })
})