function __init(root, git) {        
    let base_url = new URL(`${root}`, window.location.href).href;
    if(base_url.endsWith("index.html")) {
        base_url = base_url.substr(0, base_url.lastIndexOf("index.html"));
    }

    const path = window.location.href.substr(base_url.length);
    const root_url = git.is_feature_branch ? new URL(`../`, base_url).href : base_url;

    const loadBranches = async (menu) => {
        menu.classList.add("loading");

        const branches = await getBranches(`${root_url}branches.json`) ?? git.branches;

        const ul = document.createElement("ul");

        for (let branch of branches) {
            branch.base_url = `${root_url}${branch.path === "" ? "" : branch.path + "/"}`;
            branch.url = `${branch.base_url}${path}`;
            branch.url_exists = await urlExists(branch.url);

            const li = document.createElement("li");

            const a = document.createElement("a");
            a.href = branch.url_exists ? branch.url : `${branch.base_url}index.html`;
            a.innerText = branch.name;

            li.appendChild(a);

            ul.appendChild(li);
        }

        menu.innerHTML = '';
        menu.appendChild(ul);

        menu.classList.remove("loading");
    };

    const toggleMenu = (button, expand) => {
        const menuId = button.hash;
        const target = document.querySelector(menuId);
        let expanded = button.getAttribute('aria-expanded') === 'true';

        if (typeof expand == "boolean") {
            expanded = !expand;
        }

        if (menuId === "#git-branch-menu") {
            loadBranches(target);
        }

        button.setAttribute('aria-expanded', !expanded);
        target.setAttribute('aria-hidden', expanded);

        return !expanded;
    }

    const menuToggleButtons = document.querySelectorAll(".menu-toggle");

    menuToggleButtons.forEach(btn => {
        btn
            .onclick = event => {
                const toggle = event.target.closest('a');
                const toggled = toggleMenu(toggle);

                if (toggled) {
                    const [sibling] = [...menuToggleButtons].filter(menuToggleButton => menuToggleButton !== toggle);
                    toggleMenu(sibling, false);
                }

                event.preventDefault();
            };
    });

};

const urlExists = url => new Promise((resolve, reject) => {
    try {
        let request = new XMLHttpRequest;
        request.open('GET', url, true);
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        request.setRequestHeader('Accept', '*/*');
        request.onerror = () => {
            resolve(false);
        };
        request.onprogress = (event) => {
            let status = event.target.status;
            let statusFirstNumber = (status).toString()[0];
            switch (statusFirstNumber) {
                case '2':
                    request.abort();
                    resolve(true);
                case '3':
                    request.abort();
                    resolve(true);
                default:
                    request.abort();
                    resolve(false);
            };
        };
        
        request.send('');
    }
    catch(ex) {
        reject(ex);
    }
});

async function getBranches(url) {
    try {
        const response = await fetch(url);
        const json = await response.json();
        return json;
    }
    catch {
        return null
    }
}

iFrameResize({}, 'iframe');