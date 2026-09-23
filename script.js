const SUPABASE_URL = "https://ihewtealhbdpedczurop.supabase.co"; 
 
const SUPABASE_KEY = "sb_publishable_Q26L5_DRRkZvXHFs69cK6w_SrtsXYXx"; 
 
const supabaseClient = window.supabase.createClient( 
    SUPABASE_URL, 
    SUPABASE_KEY 
); 
 
document.addEventListener("DOMContentLoaded", () => { 
 
    // ========================================================= 
    // SEARCH & SORT 
    // ========================================================= 
 
    const searchInput = document.getElementById("search"); 
    const sortSelect = document.getElementById("sort"); 
    const animeGrid = document.querySelector(".anime-grid"); 
 
    const originalCards = Array.from( 
        animeGrid.querySelectorAll(".anime-card") 
    ); 
 
    function getRating(card) { 
        const text = card.querySelector(".rating")?.textContent || ""; 
        const match = text.match(/\d+(?:[.,]\d+)?/); 
 
        return match 
            ? parseFloat(match[0].replace(",", ".")) 
            : 0; 
    } 
 
    function filterAndSort() { 
        const keyword = searchInput.value.trim().toLowerCase(); 
        const sortValue = sortSelect.value; 
 
        let cards = originalCards.filter((card) => { 
            const title = 
                card.querySelector("h3")?.textContent 
                    .trim() 
                    .toLowerCase() || ""; 
 
            return title.includes(keyword); 
        }); 
 
        if (sortValue === "highest") { 
            cards.sort((a, b) => getRating(b) - getRating(a)); 
        } 
 
        if (sortValue === "lowest") { 
            cards.sort((a, b) => getRating(a) - getRating(b)); 
        } 
 
        if (sortValue === "default") { 
            cards.sort( 
                (a, b) => 
                    originalCards.indexOf(a) - 
                    originalCards.indexOf(b) 
            ); 
        } 
 
        originalCards.forEach((card) => { 
            card.style.display = "none"; 
        }); 
 
        cards.forEach((card) => { 
            card.style.display = ""; 
            animeGrid.appendChild(card); 
        }); 
    } 
 
    searchInput.addEventListener("input", filterAndSort); 
    sortSelect.addEventListener("change", filterAndSort); 
 
    filterAndSort(); 
 
 
    // ========================================================= 
    // REVIEW MODAL 
    // ========================================================= 
 
    const reviewModal = document.getElementById("reviewModal"); 
    const reviewTitle = document.getElementById("reviewTitle"); 
    const closeReview = document.getElementById("closeReview"); 
 
    const reviewName = document.getElementById("reviewName"); 
    const reviewRating = document.getElementById("reviewRating"); 
    const reviewText = document.getElementById("reviewText"); 
    const submitReview = document.getElementById("submitReview"); 

    // BUAT TOMBOL REVIEW UNTUK SEMUA ANIME
document.querySelectorAll(".anime-card").forEach((card) => {

    const animeName = card.querySelector("h3")?.textContent.trim();
    const animeInfo = card.querySelector(".anime-info");

    if (!animeName || !animeInfo) return;

    if (animeInfo.querySelector(".review-btn")) return;

    const reviewButton = document.createElement("button");

    reviewButton.className = "review-btn";
    reviewButton.dataset.anime = animeName;
    reviewButton.textContent = "Review";

    animeInfo.appendChild(reviewButton);

});
 
 
    // BUKA REVIEW 
    document.querySelectorAll(".review-btn").forEach((button) => { 
 
        button.addEventListener("click",() => { 
 
            const animeName = button.dataset.anime; 
 
            reviewTitle.textContent = "Review — " + animeName; 
 
            reviewModal.style.display = "flex"; 

            loadReviews(animeName);
 
            
 
        }); 
 
    }); 
 
     
 
 
    // TUTUP REVIEW 
    closeReview.addEventListener("click", () => { 
        reviewModal.style.display = "none"; 
    }); 
 
 
    // KLIK AREA LUAR POPUP 
    reviewModal.addEventListener("click", (event) => { 
 
        if (event.target === reviewModal) { 
            reviewModal.style.display = "none"; 
        } 
 
    }); 
 
 
    // ========================================================= 
    // KIRIM REVIEW KE SUPABASE 
    // ========================================================= 
 
    submitReview.addEventListener("click", async () => { 
 
        const name = reviewName.value.trim(); 
        const rating = Number(reviewRating.value); 
        const review = reviewText.value.trim(); 
 
        const animeName = reviewTitle.textContent 
            .replace("Review — ", "") 
            .trim(); 
 
 
        // CEK NAMA 
        if (!name) { 
            alert("Nama kamu belum diisi."); 
            reviewName.focus(); 
            return; 
        } 
 
 
        // CEK REVIEW 
        if (!review) { 
            alert("Review kamu belum diisi."); 
            reviewText.focus(); 
            return; 
        } 
 
 
        // TOMBOL SEMENTARA 
        submitReview.disabled = true; 
        submitReview.textContent = "Mengirim..."; 
 
 
        try { 
 
            const { error } = await supabaseClient 
                .from("reviews") 
                .insert([ 
                    { 
                        anime_id: animeName, 
                        name: name, 
                        rating: rating, 
                        review: review 
                    } 
                ]); 
 
 
            if (error) { 
 
                console.error("Supabase error:", error); 
 
                alert( 
                    "Review gagal dikirim.\n\n" + 
                    error.message 
                ); 
 
                return; 
            } 
 
 
            // BERHASIL 
            alert("Review berhasil dikirim! 🎉"); 
 
 
            // KOSONGKAN FORM 
            reviewName.value = ""; 
            reviewRating.value = "10"; 
            reviewText.value = ""; 
 
 
            // TUTUP POPUP 
            reviewModal.style.display = "none"; 
            await loadReviews(animeName);
 
        } catch (error) { 
 
            console.error("Error:", error); 
 
            alert( 
                "Terjadi kesalahan saat mengirim review." 
            ); 
 
        } finally { 
 
            submitReview.disabled = false; 
            submitReview.textContent = "Kirim Review"; 
 
        } 


    });
     
// ========================================================= 
// LOAD REVIEW DARI SUPABASE 
// ========================================================= 
 
async function loadReviews(animeName) {
 
    const reviewList = document.getElementById("reviewList"); 
 
    if (!reviewList) return; 
 
    reviewList.innerHTML = ` 
        <p class="no-review">Memuat review...</p> 
    `; 
 
    const { data, error } = await supabaseClient 
        .from("reviews") 
        .select("name, rating, review, created_at") 
        .eq("anime_id", animeName) 
        .order("created_at", { ascending: false }); 
 
    if (error) { 
 
        console.error("Gagal mengambil review:", error); 
 
        reviewList.innerHTML = ` 
            <p class="no-review"> 
                Gagal memuat review. 
            </p> 
        `; 
 
        return; 
    } 
 
    if (!data || data.length === 0) { 
 
        reviewList.innerHTML = ` 
            <p class="no-review"> 
                Belum ada review untuk anime ini. 
            </p> 
        `; 
 
        return; 
    } 
 
    reviewList.innerHTML = data.map((item) => ` 
        <div class="review-item"> 
 
            <div class="review-item-header"> 
 
                <span class="review-user"> 
                    ${item.name} 
                </span> 
 
                <span class="review-user-rating"> 
                    ⭐ ${item.rating}/10 
                </span> 
 
            </div> 
 
            <p class="review-item-text"> 
                ${item.review} 
            </p> 
 
        </div> 
    `).join(""); 
} 
   
       });