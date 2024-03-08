

    window.silex = window.silex || {}
    window.silex.data = {"site":{"width":960},"pages":[{"id":"page-home","displayName":"Home","link":{"linkType":"LinkTypePage","href":"#!page-home"},"canDelete":true,"canProperties":true,"canMove":true,"canRename":true,"opened":false},{"id":"page-login","displayName":"Login","link":{"linkType":"LinkTypePage","href":"#!page-login"},"canDelete":true,"canRename":true,"canMove":true,"canProperties":true}]}
    function redirectToLogin() {
      window.location.href = '/dashboard';
    }