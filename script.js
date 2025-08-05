/*
 * Entry point for the interactive slide deck.  When the page loads
 * the script determines which scene to render based on the query
 * parameters in the URL.  It also wires up the event listeners for
 * the interactive exercise contained in the first scene.  Animation
 * sequences are orchestrated using GSAP for smooth and flexible
 * transitions.
 */

// Wait until the DOM is fully loaded before initialising the page
document.addEventListener('DOMContentLoaded', () => {
  // Determine which scene should be displayed.  The user can pass
  // ?scene1, ?scene2 or ?scene3 in the URL; if no recognised
  // parameter is found the first scene is shown by default.
  const setActiveScene = () => {
    const search = window.location.search.toLowerCase();
    let sceneId = 'scene1';
    if (search.includes('scene2')) {
      sceneId = 'scene2';
    } else if (search.includes('scene3')) {
      sceneId = 'scene3';
    } else if (search.includes('scene1')) {
      sceneId = 'scene1';
    }
    document.querySelectorAll('.scene').forEach(scene => {
      scene.style.display = 'none';
    });
    const activeScene = document.getElementById(sceneId);
    if (activeScene) {
      activeScene.style.display = 'block';
    }
  };

  setActiveScene();

  // Grab scene 1 if present and attach interactivity.  Scenes 2 and 3
  // remain placeholders for future content.
  const scene1 = document.getElementById('scene1');
  if (scene1) {
    // Animate the monitor wrapper into view on page load
    const monitorWrapper = scene1.querySelector('.monitor-wrapper');
    // Grab the inner container used exclusively for the shake effect.  By
    // separating the element that gets the shake animation from the
    // wrapper responsible for centring, we avoid overriding
    // transform values that would otherwise shift the monitor out of
    // position.
    const monitorShakeContainer = scene1.querySelector('.monitor-shake-container');
    if (monitorWrapper) {
      gsap.from(monitorWrapper, { duration: 1.0, y: 50, scale: 0.9, opacity: 0, ease: 'back.out(1.7)' });
    }
    const card = scene1.querySelector('.card');
    const typedText = scene1.querySelector('#typed-text');
    const lockBtn = scene1.querySelector('#lock-btn');
    const ignoreBtn = scene1.querySelector('#ignore-btn');
    const lockedOverlay = scene1.querySelector('.locked-overlay');
    const errorOverlayNew = scene1.querySelector('.error-overlay-new');
    const padlock = scene1.querySelector('.locked-padlock');
    const lockedText = scene1.querySelector('.locked-text');
    // Newly added elements to provide positive feedback when the
    // correct action is selected.  These elements are optional
    // (older versions of the DOM may not include them) so always
    // check for existence before animating.
    const successCheck = scene1.querySelector('.success-check');
    const lockedSubtext = scene1.querySelector('.locked-subtext');

    // Helper to disable buttons
    const disableButtons = (state) => {
      lockBtn.disabled = state;
      ignoreBtn.disabled = state;
    };

    // Animate the card onto the screen on load
    gsap.from(card, { duration: 0.8, scale: 0.8, opacity: 0, ease: 'back.out(1.5)' });

    // Initialise the typed effect for the prompt message
    const typed = new Typed('#typed-text', {
      strings: ["You're stepping away — what should you do?"],
      typeSpeed: 40,
      backSpeed: 0,
      showCursor: false,
      onComplete: () => {
        // Animate the buttons into view once typing finishes
        const btns = scene1.querySelectorAll('.card-buttons .btn');
        // Use fromTo rather than from to ensure the final state
        // overrides the initial opacity/transform set in CSS.  This
        // prevents the buttons from remaining hidden when the
        // animation completes.
        gsap.fromTo(btns,
          { y: 30, opacity: 0 },
          { duration: 0.6, y: 0, opacity: 1, stagger: 0.15, ease: 'back.out(1.6)' }
        );
      }
    });

    // Sequence executed when Lock Screen is chosen
    const runLockSequence = () => {
      disableButtons(true);
      // Grab the new lock toggle used for the micro‑interaction
      const lockToggle = scene1.querySelector('#lock-toggle');
      // Ensure the toggle starts unchecked so the button appears in
      // its "unlocked" colour before the animation plays.  When the
      // overlay fades in we will check the toggle to trigger the
      // micro‑interaction.  Resetting the toggle here prevents it
      // from retaining a checked state across multiple runs.
      if (lockToggle) {
        lockToggle.checked = false;
      }
      const tl = gsap.timeline();
      // Shrink and fade out the card to reveal the overlay beneath.
      tl.to(card, { duration: 0.5, scale: 0.85, opacity: 0, ease: 'power2.inOut' });
      // Fade in the locked overlay.  When the overlay begins to fade
      // in we toggle the hidden checkbox to start the micro
      // animation on the padlock.
      tl.to(lockedOverlay, {
        duration: 0.6,
        opacity: 1,
        ease: 'power2.out',
        onStart: () => {
          // Delay the toggle change slightly to allow the user to
          // perceive the red "unlock" state of the button for a brief
          // moment before it animates to locked.  The delayed call is
          // scheduled via GSAP for consistency with the rest of the
          // timeline.
          gsap.delayedCall(0.4, () => {
            if (lockToggle) {
              lockToggle.checked = true;
            }
          });
        }
      }, '-=0.3');
      // Fade in the locked text
      tl.fromTo(lockedText, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4');
      // Animate the success checkmark if present
      if (successCheck) {
        tl.fromTo(successCheck, { opacity: 0, scale: 0.5, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.6)' }, '-=0.4');
      }
      // Animate the subtext if present
      if (lockedSubtext) {
        tl.fromTo(lockedSubtext, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3');
      }
    };

    // Sequence executed when Do Nothing is chosen
    const runErrorSequence = () => {
      // When the wrong choice is selected, display the error overlay and
      // keep it visible until the user dismisses it via the retry
      // button.  The card is faded out and slightly shrunk to hint
      // that the underlying interface is still present.  A shake
      // animation reinforces the mistake.
      disableButtons(true);
      // Shrink the card and fade it to make room for the error overlay
      gsap.to(card, { duration: 0.3, scale: 0.92, opacity: 0, ease: 'power1.inOut' });
      // Fade in the error overlay
      gsap.to(errorOverlayNew, { duration: 0.4, opacity: 1, ease: 'power2.out' });
      // Apply a shake to the monitor while the error appears
      if (monitorShakeContainer) {
        monitorShakeContainer.classList.add('shake');
        // Remove the shake class after the animation duration
        gsap.delayedCall(0.7, () => {
          monitorShakeContainer.classList.remove('shake');
        });
      }
      // Add a one‑time click handler to the retry button.  When
      // clicked, the overlay will fade out and the card will return
      // to its original state.  Buttons are re‑enabled once the
      // animation completes.
      const retryBtn = scene1.querySelector('.retry-btn');
      const onRetry = () => {
        // Remove this handler to avoid multiple bindings
        retryBtn.removeEventListener('click', onRetry);
        // Fade out the overlay and restore the card
        const tl = gsap.timeline({ onComplete: () => {
          // Disable pointer events on the overlay once hidden and
          // re‑enable the card buttons
          errorOverlayNew.style.pointerEvents = 'none';
          disableButtons(false);
        } });
        tl.to(errorOverlayNew, { duration: 0.4, opacity: 0, ease: 'power1.inOut' });
        tl.to(card, { duration: 0.4, scale: 1, opacity: 1, ease: 'power2.out' }, '-=0.3');
      };
      if (retryBtn) {
        // Ensure the overlay is interactive while visible
        errorOverlayNew.style.pointerEvents = 'auto';
        retryBtn.addEventListener('click', onRetry);
      }
    };

    // Button click handlers
    lockBtn.addEventListener('click', runLockSequence);
    ignoreBtn.addEventListener('click', runErrorSequence);
  }

  // ===========================
  // Scene 2 – Flip quiz logic
  //
  // The second scene presents a series of scenario cards.  Users
  // click a card to flip it over and choose the correct answer.
  // Feedback colours and messages reinforce learning.  After all
  // questions are completed a scoreboard appears summarising the
  // score.  A small confetti effect plays on a perfect score.
  const scene2 = document.getElementById('scene2');
  if (scene2) {
    // Elements from the DOM
    const quizCard = scene2.querySelector('#quiz-card');
    const cardInner = quizCard ? quizCard.querySelector('.quiz-card-inner') : null;
    const front = quizCard ? quizCard.querySelector('.quiz-card-front .scenario-text') : null;
    const backChoices = quizCard ? quizCard.querySelector('.quiz-card-back .choice-container') : null;
    const nextContainer = scene2.querySelector('.quiz-next');
    const nextButton = nextContainer ? nextContainer.querySelector('button') : null;
    const scoreboard = scene2.querySelector('#scoreboard');
    const scoreBox = scoreboard ? scoreboard.querySelector('.score-box') : null;
    const scoreText = scoreboard ? scoreboard.querySelector('.score-text') : null;
    const restartBtn = scoreboard ? scoreboard.querySelector('.restart-btn') : null;
    const confettiContainer = scoreboard ? scoreboard.querySelector('.confetti-container') : null;

    // Grab the notification element added above the quiz card.  This
    // popup will prompt the user to interact with the first card.
    const notificationEl = scene2.querySelector('.notifications');
    const quizContainer = scene2.querySelector('.quiz-container');

    // Define the quiz content.  Each entry includes a scenario and
    // three choice objects with text, correctness and feedback
    // messages.  The order of choices is maintained as defined.
    const quizData = [
      {
        scenario: "An employee uses their personal phone to take a picture of a workplace incident.",
        choices: [
          { text: 'Breach of Policy', correct: true, message: 'Using personal phones for incident reports is risky. Use official devices.' },
          { text: 'Safe Practice', correct: false, message: 'Even for good intentions, personal devices are not secure.' },
          { text: 'Encouraged for Transparency', correct: false, message: 'Transparency matters — but security protocols come first.' }
        ]
      },
      {
        scenario: "You find a USB drive labeled “Staff Menu 2024” in the pantry.",
        choices: [
          { text: 'Report to IT Immediately', correct: true, message: 'It could be a bait. Never plug unknown devices.' },
          { text: 'Plug It In to Check Contents', correct: false, message: 'Could contain malware or keyloggers.' },
          { text: 'Leave It on the Table', correct: false, message: 'Someone else may fall into the trap.' }
        ]
      },
      {
        scenario: "Someone walks behind you and says: ‘I\'m from the audit team, can you hold the door?’",
        choices: [
          { text: 'Politely Refuse and Ask for ID', correct: true, message: 'Always verify. No badge = no access.' },
          { text: 'Hold the Door', correct: false, message: 'Could be social engineering. Tailgating is a real threat.' },
          { text: 'Assume They\'re an Employee', correct: false, message: 'Never assume. It’s your responsibility to check.' }
        ]
      },
      {
        scenario: "You spot a coworker’s password written on a sticky note stuck to their monitor.",
        choices: [
          { text: 'Remind Them & Report to IT If Needed', correct: true, message: 'Writing passwords down puts systems at risk.' },
          { text: 'Ignore It', correct: false, message: 'Ignoring puts your team in danger.' },
          { text: 'Take Note for Emergency Use', correct: false, message: 'That’s unauthorized access — a serious offence.' }
        ]
      },
      {
        scenario: "A colleague sends a customer’s allergy info in a WhatsApp message for delivery coordination.",
        choices: [
          { text: 'Data Breach', correct: true, message: 'Personal apps are not protected. Use official tools only.' },
          { text: 'OK for Quick Tasks', correct: false, message: 'Speed doesn’t justify insecure sharing.' },
          { text: 'Not an Issue if Deleted Later', correct: false, message: 'Data can be backed up to cloud even after deletion.' }
        ]
      }
    ];

    let currentIndex = 0;
    let score = 0;
    let answered = false;

    // Helper to position the notification relative to the quiz card.
    // This computes the card’s location within the quiz container and
    // centres the bubble horizontally above it.  A small gap is
    // inserted to separate the bubble from the card.
    const positionNotification = () => {
      if (!notificationEl || !quizCard || !quizContainer) return;
      const cardRect = quizCard.getBoundingClientRect();
      const containerRect = quizContainer.getBoundingClientRect();
      const gap = 12; // distance in pixels between the card and bubble
      const top = cardRect.top - containerRect.top - gap;
      const left = cardRect.left - containerRect.left + cardRect.width / 2;
      notificationEl.style.top = `${top}px`;
      notificationEl.style.left = `${left}px`;
      notificationEl.style.transform = 'translateX(-50%)';
    };

    // Show the notification using the CSS animation.  This function
    // recalculates the bubble position before revealing it.  It
    // removes any hide class and applies the show class which
    // triggers the entrance animation defined in the CSS.
    const showNotification = () => {
      if (!notificationEl) return;
      positionNotification();
      // Reset classes and reveal the element
      notificationEl.classList.remove('hide');
      notificationEl.classList.add('show');
    };

    // Hide the notification with a reverse animation.  After the
    // animation completes the element is set to display: none to
    // prevent interaction.  This function gracefully handles cases
    // where the notification has not been shown.
    const hideNotification = () => {
      if (!notificationEl) return;
      // Only proceed if currently shown
      if (!notificationEl.classList.contains('show')) return;
      notificationEl.classList.remove('show');
      notificationEl.classList.add('hide');
      // After the hide animation finishes (duration 0.8s), set
      // display: none so the element no longer occupies space.
      setTimeout(() => {
        // Only hide if still marked as hidden to avoid race conditions
        if (notificationEl.classList.contains('hide')) {
          notificationEl.style.display = 'none';
        }
      }, 800);
    };

    // Render the current card front and back choices
    const renderCard = (idx) => {
      const data = quizData[idx];
      // Populate the scenario text
      if (front) {
        front.textContent = data.scenario;
      }
      // Clear previous choices and explanations
      if (backChoices) {
        backChoices.innerHTML = '';
      }
      const back = quizCard ? quizCard.querySelector('.quiz-card-back') : null;
      if (back) {
        // Remove any explanation element from previous question
        const expl = back.querySelector('.explanation');
        if (expl) expl.remove();
      }
      // Create choice buttons.  Shuffle the order of choices
      // so that the correct answer is not always in the first position.
      const choices = [...data.choices];
      choices.sort(() => Math.random() - 0.5);
      choices.forEach((choice) => {
        const btn = document.createElement('button');
        btn.className = 'choice';
        btn.textContent = choice.text;
        btn.dataset.correct = choice.correct;
        btn.dataset.message = choice.message;
        btn.addEventListener('click', onSelectChoice);
        if (backChoices) {
          backChoices.appendChild(btn);
        }
      });
      // Reset flags and classes
      answered = false;
      quizCard.classList.remove('correct', 'wrong');
      // Hide next button until the user answers
      if (nextContainer) {
        nextContainer.style.display = 'none';
      }
      if (nextButton) {
        nextButton.textContent = (idx < quizData.length - 1) ? 'Next' : 'Finish';
      }
      // Ensure the card is showing the front when a new card is rendered
      quizCard.classList.remove('flipped');

      // Show the notification on the first card only.  When the
      // first card is rendered (idx === 0) we schedule the pop up
      // after a short delay.  For subsequent cards the notification
      // remains hidden.  Any pending timeouts from prior runs are
      // cleared to avoid multiple triggers.
      if (notificationEl) {
        // Clear any existing timers stored on the element
        if (notificationEl._timeout) {
          clearTimeout(notificationEl._timeout);
        }
        if (idx === 0) {
          // Delay showing the notification by 1 second to give
          // users a moment to orient themselves.  Leave the element
          // hidden until the animation begins to avoid flashing it
          // at the top of the frame.
          notificationEl._timeout = setTimeout(() => {
            showNotification();
          }, 1000);
        } else {
          // Hide the notification immediately for all other cards
          hideNotification();
        }
      }
    };

    // Handle card front click to flip
    if (quizCard) {
      quizCard.addEventListener('click', (e) => {
        // Only flip when clicking on the front face and not yet flipped
        // Avoid flipping again if the card has already been flipped or answered
        if (!quizCard.classList.contains('flipped') && !answered) {
          // Determine if the click originated within the front face
          const rect = quizCard.getBoundingClientRect();
          // Simple check: if the inner container hasn't been rotated yet, flip
          quizCard.classList.add('flipped');
        }

        // If the notification is visible when the user interacts with
        // the card, hide it smoothly.  This ensures the bubble does
        // not linger after the interaction has begun.  The event
        // listener uses a check rather than relying on `once` so
        // subsequent clicks during the same card do not re‑show the
        // notification.  The hideNotification function guards
        // against running twice.
        if (notificationEl) {
          hideNotification();
        }
      });
    }

    // Choice selection handler
    const onSelectChoice = (e) => {
      if (answered) return;
      answered = true;
      const btn = e.currentTarget;
      const isCorrect = btn.dataset.correct === 'true';
      // Apply feedback classes to the card and button
      if (isCorrect) {
        score++;
        btn.classList.add('correct');
        quizCard.classList.add('correct');
      } else {
        btn.classList.add('wrong');
        quizCard.classList.add('wrong');
      }
      // Disable all choice buttons and highlight the correct one
      const allChoices = backChoices ? backChoices.querySelectorAll('.choice') : [];
      allChoices.forEach((b) => {
        b.disabled = true;
        if (b !== btn && b.dataset.correct === 'true') {
          b.classList.add('correct');
        }
      });
      // Display explanation message
      const message = btn.dataset.message;
      const expl = document.createElement('div');
      expl.className = 'explanation';
      expl.textContent = message;
      const back = quizCard.querySelector('.quiz-card-back');
      back.appendChild(expl);
      // Show next/finish button
      if (nextContainer) {
        nextContainer.style.display = 'block';
      }
    };

    // Advance to the next card or show the scoreboard
    const goToNext = () => {
      currentIndex++;
      if (currentIndex < quizData.length) {
        renderCard(currentIndex);
      } else {
        // Quiz finished; show score overlay
        if (scoreText) {
          scoreText.textContent = `Score: ${score}/${quizData.length}`;
        }
        if (scoreboard) {
          scoreboard.style.display = 'flex';
        }
        // Trigger confetti on perfect score
        if (score === quizData.length) {
          launchConfetti();
        }
      }
    };

    // Restart the quiz
    const restartQuiz = () => {
      currentIndex = 0;
      score = 0;
      answered = false;
      if (scoreboard) {
        scoreboard.style.display = 'none';
      }
      if (confettiContainer) {
        confettiContainer.innerHTML = '';
      }
      renderCard(0);
    };

    // Confetti generator.  Creates a set number of confetti pieces
    // with random positions, colours and fall durations.  This
    // effect is intentionally lightweight—no external libs are
    // imported.  Confetti pieces are appended to the overlay’s
    // confetti container and will automatically clean up when the
    // overlay is hidden and restarted.
    const launchConfetti = () => {
      const colours = [
        'rgba(143, 247, 122, 0.9)', // green
        'rgba(196, 158, 234, 0.9)', // lavender
        'rgba(146, 224, 128, 0.9)', // pastel green
        'rgba(91, 192, 235, 0.9)'  // success blue from the palette
      ];
      const pieceCount = 40;
      if (!confettiContainer) return;
      confettiContainer.innerHTML = '';
      for (let i = 0; i < pieceCount; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        const size = Math.random() * 6 + 4; // 4px – 10px
        piece.style.width = `${size}px`;
        piece.style.height = `${size}px`;
        piece.style.background = colours[i % colours.length];
        piece.style.left = `${Math.random() * 100}%`;
        // Random animation duration and delay
        const duration = 3 + Math.random() * 2; // 3–5 seconds
        const delay = Math.random() * 0.5;
        piece.style.animationDuration = `${duration}s`;
        piece.style.animationDelay = `${delay}s`;
        confettiContainer.appendChild(piece);
      }
    };

    // Bind next/finish and restart buttons
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        goToNext();
      });
    }
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        restartQuiz();
      });
    }
    // Initialise the first card if the scene is active
    renderCard(0);
  }
});