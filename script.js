// Time update function
function updateTime() {
    document.getElementById('current-time').textContent = 
        new Date().toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
}

// Menu handling with event delegation
document.addEventListener('DOMContentLoaded', function() {
    const contentSections = document.querySelectorAll('.content-section');
    const menuContainers = document.querySelectorAll('.menu');
    
    // Добавляем обработчик ко всем меню
    menuContainers.forEach(menu => {
        menu.addEventListener('click', function(e) {
            if (e.target.classList.contains('menu-item')) {
                // Убираем активность у всех пунктов меню
                document.querySelectorAll('.menu-item').forEach(item => 
                    item.classList.remove('active'));
                
                // Добавляем активность к выбранному пункту
                e.target.classList.add('active');
                
                // Скрываем все секции контента
                contentSections.forEach(section => 
                    section.classList.remove('active'));
                
                // Показываем выбранную секцию
                const targetSection = document.getElementById(e.target.dataset.target);
                if (targetSection) targetSection.classList.add('active');
            }
        });
    });
    
    // Initial time update and interval
    updateTime();
    setInterval(updateTime, 60000);
});