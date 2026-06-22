/* 
 * Rayhan Adytia Oemarin — macOS-Style Portfolio Core Script
 * Router, theme managers, filters, notifications, and form handlers
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================================================
  // 1. Core State & Element Selectors
  // ==========================================================================
  
  const dockItems = document.querySelectorAll('.dock-item-wrapper[data-page]');
  const sections = document.querySelectorAll('.page-section');
  const themeToggle = document.getElementById('theme-toggle');
  const filterPills = document.querySelectorAll('.filter-pill');
  const projectCards = document.querySelectorAll('.project-card');
  const contactForm = document.getElementById('contact-form');
  const floatingDockButtons = document.querySelectorAll('#floating-dock button[data-page]');
  
  let activeTab = 'home';

  // ==========================================================================
  // 2. SPA Router & Active State Synchronizer
  // ==========================================================================
  
  let isScrollingProgrammatically = false;
  let scrollTimeout = null;

  function updateActiveStates(targetId, triggerBounce = false, isScrollSync = false) {
    // 1. Reset active states for sections, sidebar and dock
    sections.forEach(sec => {
      if (sec.id === targetId) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });
    
    dockItems.forEach(item => {
      item.classList.remove('active');
      const icon = item.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.style.fontVariationSettings = "'FILL' 0";
      }
    });
    
    // 3. Active dock item
    const matchingDockItem = document.querySelector(`.dock-item-wrapper[data-page="${targetId}"]`);
    if (matchingDockItem) {
      matchingDockItem.classList.add('active');
      const icon = matchingDockItem.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.style.fontVariationSettings = "'FILL' 1";
      }
      
      // Trigger Dock Bounce Animation if requested
      if (triggerBounce) {
        const itemBody = matchingDockItem.querySelector('.dock-item');
        if (itemBody) {
          itemBody.classList.add('dock-bounce');
          setTimeout(() => {
            itemBody.classList.remove('dock-bounce');
          }, 600);
        }
      }
    }

    // 4. Reset active states for floating capsule menu
    floatingDockButtons.forEach(btn => {
      btn.classList.remove('text-primary', 'scale-105');
      btn.classList.add('text-neutral-600', 'dark:text-on-surface-variant');
      const icon = btn.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.style.fontVariationSettings = "'FILL' 0";
      }
    });

    // Active floating dock item
    const matchingFloatingBtn = document.querySelector(`#floating-dock button[data-page="${targetId}"]`);
    if (matchingFloatingBtn) {
      matchingFloatingBtn.classList.add('text-primary', 'scale-105');
      matchingFloatingBtn.classList.remove('text-neutral-600', 'dark:text-on-surface-variant');
      const icon = matchingFloatingBtn.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.style.fontVariationSettings = "'FILL' 1";
      }
    }

    activeTab = targetId;
    
    // Sync URL hash
    if (isScrollSync) {
      history.replaceState(null, null, `#${targetId}`);
    } else {
      history.pushState(null, null, `#${targetId}`);
    }
  }

  function switchPage(pageId, triggerBounce = false, smooth = true) {
    if (!pageId) return;
    
    // Normalize pageId (strip hash if present)
    const targetId = pageId.replace('#', '').toLowerCase();
    
    // Find if section exists
    const targetSection = document.getElementById(targetId);
    if (!targetSection) return;
    
    // Update visual active states
    updateActiveStates(targetId, triggerBounce, false);

    // Scroll canvas context to the top smoothly
    const canvas = document.getElementById('finder-canvas');
    if (canvas) {
      isScrollingProgrammatically = true;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      
      canvas.scrollTo({ 
        top: targetSection.offsetTop, 
        behavior: smooth ? 'smooth' : 'auto' 
      });
      
      scrollTimeout = setTimeout(() => {
        isScrollingProgrammatically = false;
      }, 1000);
    }
  }

  // Expose switchPage globally so inline onclick handlers work
  window.switchPage = switchPage;

  // Bind Dock Items
  dockItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-page');
      switchPage(page, true);
    });
  });

  // Cache section offsets to prevent layout thrashing (scroll lag)
  let sectionOffsets = [];
  function recalculateOffsets() {
    sectionOffsets = Array.from(sections).map(sec => ({
      id: sec.id,
      offsetTop: sec.offsetTop
    }));
  }

  // Calculate initially and on window events
  recalculateOffsets();
  window.addEventListener('resize', recalculateOffsets);
  window.addEventListener('load', recalculateOffsets);

  // ScrollSpy - Detect active section on scroll using cached offsets
  const canvas = document.getElementById('finder-canvas');
  if (canvas) {
    canvas.addEventListener('scroll', () => {
      if (isScrollingProgrammatically) return;
      
      let currentActive = activeTab;
      const scrollTop = canvas.scrollTop;
      
      // Check if we reached the bottom of the container
      if (scrollTop + canvas.clientHeight >= canvas.scrollHeight - 20) {
        const lastSection = sections[sections.length - 1];
        if (lastSection) {
          currentActive = lastSection.id;
        }
      } else {
        // Find which section is currently active based on cached offsets
        sectionOffsets.forEach(sec => {
          if (scrollTop >= sec.offsetTop - 120) {
            currentActive = sec.id;
          }
        });
      }
      
      if (currentActive && currentActive !== activeTab) {
        updateActiveStates(currentActive, false, true);
      }
    });
  }



  // Handle URL hash on initial load
  function handleInitialHash() {
    const hash = window.location.hash;
    if (hash) {
      switchPage(hash, true, false);
    } else {
      switchPage('home', false, false);
    }
  }

  window.addEventListener('popstate', () => {
    handleInitialHash();
  });

  handleInitialHash();

  // ==========================================================================
  // 3. MacOS Dark/Light Mode Theme System
  // ==========================================================================
  
  function updateFilterPillStyles() {
    const isLight = document.body.classList.contains('light-mode');
    filterPills.forEach(p => {
      const isCurrentlyActive = p.classList.contains('bg-primary') || p.classList.contains('bg-primary-container') || p.classList.contains('text-black') || (p.classList.contains('text-white') && p.classList.contains('bg-primary-container'));
      
      // Clear classes
      p.classList.remove(
        'bg-primary', 'text-black', 
        'bg-primary-container', 'text-white',
        'bg-white/5', 'border-white/10', 'text-on-surface-variant',
        'bg-black/5', 'border-black/10', 'text-neutral-700'
      );
      
      if (isCurrentlyActive) {
        if (isLight) {
          p.classList.add('bg-primary-container', 'text-white');
        } else {
          p.classList.add('bg-primary', 'text-black');
        }
      } else {
        if (isLight) {
          p.classList.add('bg-black/5', 'border', 'border-black/10', 'text-neutral-700');
        } else {
          p.classList.add('bg-white/5', 'border', 'border-white/10', 'text-on-surface-variant');
        }
      }
    });
  }

  function setTheme(isLight) {
    const htmlEl = document.documentElement;
    if (isLight) {
      document.body.classList.add('light-mode');
      htmlEl.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      htmlEl.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    updateFilterPillStyles();
  }

  // Check storage or system preference
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  
  if (savedTheme === 'light' || (!savedTheme && systemPrefersLight)) {
    setTheme(true);
  } else {
    setTheme(false);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isLightMode = document.body.classList.contains('light-mode');
      setTheme(!isLightMode);
    });
  }

  // ==========================================================================
  // 4. Live Date/Time Clock (MenuBar)
  // ==========================================================================
  
  function updateMenuBarTime() {
    const timeSpan = document.getElementById('menu-bar-time');
    if (!timeSpan) return;
    const now = new Date();
    const options = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    };
    timeSpan.textContent = now.toLocaleDateString('en-US', options);
  }
  setInterval(updateMenuBarTime, 30000);
  updateMenuBarTime();

  // ==========================================================================
  // 5. Close Window Mock Interaction
  // ==========================================================================
  
  const closeBtn = document.getElementById('window-btn-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const windowEl = document.querySelector('main > div');
      if (windowEl) {
        windowEl.classList.add('scale-[0.85]', 'opacity-0', 'pointer-events-none');
        showNotification('Window Closed', 'Click any Dock icon to reopen the window.', false);
      }
    });
  }

  // Re-open window upon clicking any dock item if it was closed
  dockItems.forEach(item => {
    item.addEventListener('click', () => {
      const windowEl = document.querySelector('main > div');
      if (windowEl && windowEl.classList.contains('opacity-0')) {
        windowEl.classList.remove('scale-[0.85]', 'opacity-0', 'pointer-events-none');
      }
    });
  });

  // ==========================================================================
  // 6. Projects Category Filter Controller
  // ==========================================================================
  
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      // Clear active style from all pills
      filterPills.forEach(p => {
        p.classList.remove('bg-primary', 'text-black', 'bg-primary-container', 'text-white');
      });
      
      // Add active style based on theme
      const isLight = document.body.classList.contains('light-mode');
      if (isLight) {
        pill.classList.add('bg-primary-container', 'text-white');
      } else {
        pill.classList.add('bg-primary', 'text-black');
      }
      
      // Sync remaining pills styles
      updateFilterPillStyles();
      
      const filterValue = pill.getAttribute('data-filter');
      
      projectCards.forEach(card => {
        const categories = card.getAttribute('data-category').split(' ');
        if (filterValue === 'all' || categories.includes(filterValue)) {
          card.style.display = 'flex';
          card.style.opacity = '0';
          card.style.transform = 'translateY(8px) scale(0.98)';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
          }, 30);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // ==========================================================================
  // 7. Contact Form Mail Client Dispatcher
  // ==========================================================================
  
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const nameVal = document.getElementById('form-name').value.trim();
      const emailVal = document.getElementById('form-email').value.trim();
      const messageVal = document.getElementById('form-message').value.trim();
      
      if (!nameVal || !emailVal || !messageVal) {
        showNotification('Mail Draft Error', 'Please fill out all fields in the contact form.', true);
        return;
      }
      
      const submitBtn = document.getElementById('form-btn-submit');
      const originalBtnContent = submitBtn.innerHTML;
      
      // Update button state
      submitBtn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span><span>Sending...</span>';
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-70');

      fetch("https://formsubmit.co/ajax/rayhan.adytia11@gmail.com", {
          method: "POST",
          headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
          },
          body: JSON.stringify({
              name: nameVal,
              email: emailVal,
              message: messageVal,
              _subject: `New message from ${nameVal} (Portfolio)`
          })
      })
      .then(response => response.json())
      .then(data => {
          showNotification('Message Sent!', 'Your message has been sent successfully to Rayhan.');
          contactForm.reset();
      })
      .catch(error => {
          showNotification('Sending Failed', 'Could not send the message. Please try again.', true);
      })
      .finally(() => {
          // Restore button state
          submitBtn.innerHTML = originalBtnContent;
          submitBtn.disabled = false;
          submitBtn.classList.remove('opacity-70');
      });
    });
  }

  // ==========================================================================
  // 8. Elegant macOS Banner Notifications
  // ==========================================================================
  
  function showNotification(title, message, isError = false) {
    let notifierWrapper = document.getElementById('mac-notifier-root');
    if (!notifierWrapper) {
      notifierWrapper = document.createElement('div');
      notifierWrapper.id = 'mac-notifier-root';
      notifierWrapper.style.position = 'fixed';
      notifierWrapper.style.top = '36px';
      notifierWrapper.style.right = '24px';
      notifierWrapper.style.zIndex = '9999';
      notifierWrapper.style.display = 'flex';
      notifierWrapper.style.flexDirection = 'column';
      notifierWrapper.style.gap = '12px';
      notifierWrapper.style.pointerEvents = 'none';
      document.body.appendChild(notifierWrapper);
    }
    
    const banner = document.createElement('div');
    banner.style.width = '280px';
    banner.style.padding = '12px 14px';
    banner.style.borderRadius = '12px';
    banner.style.backgroundColor = 'var(--bg-surface)';
    banner.style.border = '1px solid var(--border-surface)';
    banner.style.backdropFilter = 'blur(20px)';
    banner.style.webkitBackdropFilter = 'blur(20px)';
    
    // Soft shadow
    banner.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.4)';
    if (document.body.classList.contains('light-mode')) {
      banner.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.06)';
    }
    
    banner.style.display = 'flex';
    banner.style.gap = '10px';
    banner.style.alignItems = 'flex-start';
    banner.style.transform = 'translateX(320px)';
    banner.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    banner.style.pointerEvents = 'auto';
    
    const iconColor = isError ? '#ff5f56' : '#0071e3';
    const iconSvg = isError 
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    
    banner.innerHTML = `
      <div style="flex-shrink: 0; margin-top: 1px;">${iconSvg}</div>
      <div style="flex-grow: 1;">
        <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">${title}</div>
        <div style="font-size: 10.5px; color: var(--text-secondary); line-height: 1.3;">${message}</div>
      </div>
      <button style="border:none; background:none; font-size:12px; font-weight:500; cursor:pointer; color:var(--text-muted); line-height:1; margin-top:-2px;" onclick="this.parentElement.remove()">×</button>
    `;
    
    notifierWrapper.appendChild(banner);
    
    setTimeout(() => {
      banner.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
      banner.style.transform = 'translateX(320px)';
      setTimeout(() => {
        banner.remove();
      }, 400);
    }, 4500);
  }

  // Expose to global scope for inline handlers
  window.showNotification = showNotification;
  
  window.copyEmailToClipboard = function(email) {
    navigator.clipboard.writeText(email).then(() => {
      showNotification('Email Copied', `${email} has been copied to your clipboard.`);
    }).catch(err => {
      showNotification('Copy Failed', 'Could not copy email to clipboard.', true);
    });
  };

});
