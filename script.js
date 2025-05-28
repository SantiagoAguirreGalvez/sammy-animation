"use strict";
gsap.registerPlugin(ScrollTrigger);

// Function to dynamically generate and inject initial slide styles
function generateSlideStyles(numberOfSlides) {
    let styles = '';
    // Determine the furthest initial Z-value.
    // Based on your example, slide 1 starts at -22500px, and each subsequent
    // slide is 2500px "closer" (less negative).
    // So, slide N's initial Z will be: initialFurthestZ + (N-1) * zStep
    const initialFurthestZ = -22500; // Z-value for the first slide (slide-1)
    const zStep = 2500;             // How much Z changes per slide

    for (let i = 1; i <= numberOfSlides; i++) {
        const slideId = `slide-${i}`;
        const leftValue = (i % 2 !== 0) ? '70%' : '30%'; // Odd slides 70%, Even slides 30%

        // Calculate the initial translateZ for each slide.
        // This is the static Z-position they will have BEFORE any scrolling interaction.
        const initialTranslateZ = initialFurthestZ + (i - 1) * zStep;

        styles += `
            #${slideId} {
                position: absolute;
                top: 40%;
                left: ${leftValue};
                transform: translateX(-50%) translateY(-50%) translateZ(${initialTranslateZ}px);
                opacity: 0; /* All slides start hidden, then JS animates */
                /* Consider adding a base transition for properties not controlled by ScrollTrigger */
                /* transition: transform 0.1s linear, opacity 0.1s linear; */
            }
        `;
    }

    // Inject these styles into the document
    let styleTag = document.getElementById('dynamic-slide-styles');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-slide-styles';
        document.head.appendChild(styleTag);
    }
    // styleTag.innerHTML = styles;
}


window.addEventListener("load", function () {
    // --- Dynamic CSS Generation ---
    // First, determine the number of slides you have.
    // Assuming your slides have a common class like '.slide' or you know the count.
    const numberOfSlides = document.querySelectorAll('.slide').length;
    // If you don't have slides in HTML yet, you'd define the number directly
    // const numberOfSlides = 10; // Or whatever dynamic number you determine
    generateSlideStyles(numberOfSlides);
    // ----------------------------


    const slides = gsap.utils.toArray(".slide");
    const activeSlideImages = gsap.utils.toArray(".active-slide img");

    // This function needs to be able to read the initial Z value set by our
    // dynamically generated CSS. It needs to be inside the 'load' listener
    // or called after the dynamic styles are applied.
    function getInitialTranslateZ(slide) {
        const style = window.getComputedStyle(slide);
        const transformValue = style.transform;

        // Use a more robust way to extract translateZ from a 3D transform matrix
        const matrix = transformValue.match(/matrix3d\((.+)\)/);
        if (matrix) {
            const values = matrix[1].split(", "); // Use ", " to split correctly
            // The translateZ component is at index 14 in a 3D matrix
            return parseFloat(values[14] || 0);
        }

        // If it's a 2D matrix or no transform, translateZ is 0
        const matrix2d = transformValue.match(/matrix\((.+)\)/);
        if (matrix2d) {
            return 0; // No Z component in 2D matrix
        }
        return 0; // Default if no transform
    }

    function mapRange(value, inMin, inMax, outMin, outMax) {
        return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    }

    slides.forEach((slide, index) => {
        // Read the initial Z from the dynamically generated CSS
        const initialZ = getInitialTranslateZ(slide);

        ScrollTrigger.create({
            trigger: ".container", // Ensure this trigger covers your whole scrollable area
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onUpdate: (self) => {
                const progress = self.progress;
                // The total Z distance covered by the scroll animation.
                // If you want the slides to move from their furthest point (e.g., -22500)
                // to 0, then the total displacement needed is 22500.
                const zDisplacementTotal = 7200 + 800; // Example, depends on your furthest initial Z and final Z
                                                        // If initialZ is -22500 for slide 1, and it needs to reach 0,
                                                        // then the total displacement needed is 22500.
                                                        // Adjust this value based on the total Z-range you want to cover.
                const zIncrement = progress * zDisplacementTotal; // This will shift all slides forward.

                const currentZ = initialZ + zIncrement;

                let opacity;
                if (currentZ > -800) { // When currentZ is approaching 0 from -2500
                    opacity = mapRange(currentZ, -2500, 0, 0.5, 1);
                } else { // When currentZ is further back than -2500
                    // You might need to adjust this range based on your exact desired fade.
                    // If slides should only appear closer to -2500, then this range should be tighter.
                    opacity = mapRange(currentZ, -5000, -2500, 0, 0.5); // Example: fading from -5000 to -2500
                    // Ensure opacity doesn't go below 0 or above 1
                    opacity = Math.max(0, Math.min(1, opacity));
                }

                slide.style.opacity = opacity;
                slide.style.transform = `translateX(-50%) translateY(-50%) translateZ(${currentZ}px)`;

                // Assuming activeSlideImages matches slides array by index
                if (activeSlideImages[index]) {
                    if (currentZ < 100 && currentZ > -800) { // Only animate when relevantly close
                        gsap.to(activeSlideImages[index], {
                            opacity: 1,
                            duration: 0.5, // Reduced duration for snappier response
                            ease: "power3.out",
                        });
                    } else {
                        gsap.to(activeSlideImages[index], {
                            opacity: 0.3,
                            duration: 0.5,
                            ease: "power3.out",
                        });
                    }
                }
            },
        });
    });
});