// Custom JavaScript for Venezia Ice Cream Management System

// QR Code printing function
function printQR(elementId) {
    const printContent = document.getElementById(elementId);
    const originalContents = document.body.innerHTML;
    
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    
    // Reinitialize AdminLTE components after restoring content
    if (typeof $.AdminLTE !== 'undefined') {
        $.AdminLTE.layout.fix();
        $.AdminLTE.controlSidebar.fix();
    }
}

// Initialize AdminLTE tooltips and popovers
$(document).ready(function() {
    $('[data-toggle="tooltip"]').tooltip();
    $('[data-toggle="popover"]').popover();
    
    // Fix layout after dynamic content changes
    if (typeof $.AdminLTE !== 'undefined') {
        $(window).on('load', function() {
            $.AdminLTE.layout.fix();
        });
    }
});
