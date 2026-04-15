const tabsContainer = document.querySelector(".tabs-container");
const tabsList = tabsContainer.querySelector("ul.tabs-titles");
const tabButtons = tabsContainer.querySelectorAll("a.tabs-link");
const tabPanels = tabsContainer.querySelectorAll(".tabs__panels > div");

tabsList.setAttribute("role", "tablist");
tabsList.querySelectorAll('li').forEach((listitem) => {
    listitem.setAttribute("role", "presentation");
});

tabButtons.forEach((tab, index) => {
    tab.setAttribute("role", "tab");
    if (index == 0) {
        tab.setAttribute("aria-selected", "true");
    } else {
        tab.setAttribute("tabindex", "-1");
        tabPanels[index].setAttribute("hidden", "");
    }
});

tabPanels.forEach((panel) => {
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("tabindex", "0");
});

function mod(n, m) {
  return ((n % m) + m) % m;
}

function move_tab_by(change) {
    const current_tab = document.activeElement;
    const current_index = [...tabButtons].indexOf(current_tab);
    select_tab(tabButtons[mod(current_index + change, tabButtons.length)]);
}

tabsList.addEventListener("keydown", (e) => {
    switch (e.key) {
        case 'ArrowLeft': 
            move_tab_by(-1);
            break;
        case 'ArrowRight':
            move_tab_by(1);
            break;
        case 'Home':
            e.preventDefault();
            select_tab(tabButtons[0]);
            break;
        case 'End':
            e.preventDefault();
            select_tab(tabButtons[tabButtons.length - 1]);
            break;
    }
});

function select_tab(new_tab) {
    const id = new_tab.getAttribute("href");
    const panel = tabsContainer.querySelector(id);
    tabButtons.forEach((button) => {
        button.setAttribute("aria-selected", "false");
        button.setAttribute("tabindex", "-1");
    });
    tabPanels.forEach((panel) => {
        panel.setAttribute("hidden", "");
    });
    panel.removeAttribute("hidden");
    new_tab.setAttribute("aria-selected", "true");
    new_tab.setAttribute("tabindex", "0");
    new_tab.focus();
}

tabsList.addEventListener("click", (e) => {
    e.preventDefault();
    const clickedTab = e.target.closest("a");
    if (!clickedTab) {
        return;
    }
    
    select_tab(e.target);
});

