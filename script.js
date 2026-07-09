// Small JavaScript to make the mobile nav work and add simple interactions.
// Comments explain each part so you can learn what it does.

/* Toggle mobile navigation: when the button is clicked, show or hide the nav links */
document.addEventListener('DOMContentLoaded', function () {
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('nav-toggle');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      // Toggle an attribute for CSS to show/hide nav (we use inline style here for simplicity)
      if (nav.style.display === 'flex' || nav.style.display === '') {
        nav.style.display = 'none';
        toggle.textContent = '☰';
        toggle.setAttribute('aria-label', 'Open navigation');
      } else {
        nav.style.display = 'flex';
        toggle.textContent = '✕';
        toggle.setAttribute('aria-label', 'Close navigation');
      }
    });

    // Close the nav when a link is clicked (nice for mobile)
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth <= 880) {
          nav.style.display = 'none';
          toggle.textContent = '☰';
        }
      });
    });
  }

  /* Make project cards show a friendly message when clicked.
     This is a gentle interaction so you can add more behavior later. */
  document.querySelectorAll('.project').forEach(function (card) {
    card.addEventListener('click', function () {
      var title = card.querySelector('h3') ? card.querySelector('h3').textContent : 'Project';
      // Small note shown to the visitor; you can change this into a modal later.
      alert(title + '\n\nGreat! You can edit this project description in the repository.');
    });
  });

  /* Smooth scrolling for internal links */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});
