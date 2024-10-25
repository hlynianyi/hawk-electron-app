const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  // Создаем плашку MUTE, если её нет
  const muteIndicator = document.createElement('div');
  muteIndicator.style.position = 'fixed';
  muteIndicator.style.top = '20px';
  muteIndicator.style.right = '20px';
  muteIndicator.style.padding = '15px 20px';
  muteIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  muteIndicator.style.color = 'white';
  muteIndicator.style.borderRadius = '12px';
  muteIndicator.style.fontSize = '14px';
  muteIndicator.style.fontWeight = 'bold';
  muteIndicator.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  muteIndicator.style.transition = 'opacity 0.3s ease';
  muteIndicator.style.opacity = '0';
  muteIndicator.style.zIndex = '9999';
  muteIndicator.innerText = 'MUTED';
  document.body.appendChild(muteIndicator);

  let isMuted = false;

  // Проверка фактического состояния звука при загрузке
  function checkAudioMutedState() {
    ipcRenderer.invoke('get-audio-muted').then((muted) => {
      isMuted = muted;
      muteIndicator.style.opacity = isMuted ? '1' : '0';  // Синхронизируем плашку
    });
  }

  // Отключение звука по нажатию "S" или "Ы"
  document.addEventListener('keydown', (event) => {
    if (event.key === 's' || event.key === 'S' || event.key === 'ы' || event.key === 'Ы') {
      isMuted = !isMuted;
      ipcRenderer.send('toggle-mute', isMuted);  // Отправляем команду в main.js
      muteIndicator.style.opacity = isMuted ? '1' : '0';
    }
  });

  // Удаление кнопки "Сделать ставку" с помощью MutationObserver
  function removeBetButtons() {
    // Удаляем обе версии кнопки с разными классами
    const betButtons = document.querySelectorAll(
      'button.v-btn.v-btn--elevated.v-theme--light.v-btn--density-default.v-btn--size-default.v-btn--variant-elevated.bg-primary.label-primary, ' +
      'button.v-btn.v-btn--elevated.v-theme--light.v-btn--density-default.v-btn--size-small.v-btn--variant-elevated.bg-primary.label-primary'
    );

    betButtons.forEach(button => {
      button.remove();
      console.log('Кнопка "Сделать ставку" удалена.');
    });
  }

  // Используем MutationObserver для отслеживания изменений в DOM и удаления кнопки
  const observer = new MutationObserver(() => {
    removeBetButtons();  // Проверяем и удаляем кнопку при любых изменениях в DOM
  });

  // Начинаем отслеживание изменений в body
  observer.observe(document.body, { childList: true, subtree: true });

  function showNotification(message) {
    // Создаем элемент уведомления
    const notify = document.createElement('div');
    notify.style.position = 'fixed';
    notify.style.top = '20px';
    notify.style.right = '20px';
    notify.style.padding = '10px 20px';
    notify.style.backgroundColor = 'rgba(255, 0, 0, 0.8)'; // Красный фон
    notify.style.color = 'white';
    notify.style.borderRadius = '8px';
    notify.style.fontSize = '14px';
    notify.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    notify.style.zIndex = '9999';
    notify.innerText = message;

    // Добавляем уведомление в тело документа
    document.body.appendChild(notify);

    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
      notify.remove();
    }, 3000);
  }

  // Функция для выбора карты по клавишам 1, 2, 3 и т.д.
  function selectMap(keyPressed) {
    console.log('inside selectMap keyPressed:', keyPressed)
    const mapIndex = keyPressed - 1;
    
    return new Promise((resolve, reject) => {
      const mapListItems = document.querySelectorAll('.v-list-item-title');
      console.log(mapListItems);

      if (mapListItems && mapListItems[mapIndex]) {
        setTimeout(() => {
          mapListItems[mapIndex].click();
          console.log(`Выбрана карта ${mapIndex}`);
          resolve(); // Успешно выбираем карту
        }, 250);
      } else {
        console.log(`Карта ${keyPressed} не найдена.`);
        let mapButton = document.getElementById('match-view-series-menu');
        mapButton.click();
        showNotification(`Карта ${keyPressed} не найдена.`); // Показываем уведомление
        reject("Карта не найдена");
      }
    });
  }



  // Обработка клавиш "R", "Q" и выбора карты
  document.addEventListener('keydown', function(event) {
    let mapButton = document.getElementById('match-view-series-menu');

    if (event.key === 'r' || event.key === 'R' || event.key === 'к' || event.key === 'К') {
      performScroll();
    }

    // Переключение пресетов на Z (я) и X (ч)
    if (event.key === 'z' || event.key === 'я' || event.key === 'Я' || event.key === 'Z') {
      ipcRenderer.send('set-preset', 'compact');  // Short Hawk
    } else if (event.key === 'x' || event.key === 'ч' || event.key === 'Ч' || event.key === 'X') {
      ipcRenderer.send('set-preset', 'long');  // Long Hawk
    } else if (event.key === 'c' || event.key === 'с' || event.key === 'C' || event.key === 'С') { // Main page
      ipcRenderer.send('set-preset', 'homepage'); 

    }

    if (event.key === '1' || event.key == '2' || event.key == '3' || event.key == '4' || event.key == '5') {
      console.log(event.key, '- нажата кнопка')
      sessionStorage.setItem("selectedMap", event.key);
      this.location.reload();
    }
  // конец логики прослушивания клавиш
  });

  function performScroll() {
    const windowWidth = window.innerWidth;
    const scrollValue = windowWidth > 620 ? 338 : 425; 
    window.scrollTo({
      top: scrollValue,
      behavior: 'smooth'
    });
    console.log(`Ширина окна: ${windowWidth}, значение скролла: ${scrollValue}`);
  }

  window.addEventListener('load', function() {
    console.log('windows loaded, map chosen:', this.sessionStorage.getItem('selectedMap'))

    let selectedMap;
    if (this.sessionStorage.getItem('selectedMap')) {
      selectedMap = this.sessionStorage.getItem('selectedMap');
      sessionStorage.removeItem('selectedMap');
      console.log('selectedMap let:', selectedMap)
      let mapButton = document.getElementById('match-view-series-menu');
      Promise.resolve()
        .then(() => {
          mapButton.click();
          return new Promise(resolve => setTimeout(resolve, 400));
        })
        .then(() => {
          selectMap(selectedMap)
          return new Promise(resolve => setTimeout(resolve, 400))
        })
        .then(() => {
          return performScroll();
        })
        .then(() => {
          console.log("Проверка позиции скролла:", window.scrollY);
        })
        .catch(err => {
          console.error("Ошибка при выполнении последовательности:", err);
        });
    }
    checkAudioMutedState();
  });

  // Слушаем сообщение от main.js для выполнения автоскролла после изменения пресета
  ipcRenderer.on('perform-scroll', () => {
    performScroll(); 
  });

  let isScrolling;
  window.addEventListener('scroll', function () {
    document.body.classList.add('scroll-active');
    window.clearTimeout(isScrolling);
    isScrolling = setTimeout(function () {
      document.body.classList.remove('scroll-active');
    }, 1000);
  });

  const style = document.createElement('style');
  style.innerHTML = `
    ::-webkit-scrollbar {
        width: 0;
    }
    body.scroll-active::-webkit-scrollbar {
        width: 8px;
    }
    ::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.5);
        border-radius: 4px;
    }
  `;
  document.head.appendChild(style);
});
