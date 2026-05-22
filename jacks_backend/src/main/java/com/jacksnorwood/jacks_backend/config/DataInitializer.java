package com.jacksnorwood.jacks_backend.config;

import com.jacksnorwood.jacks_backend.entity.*;
import com.jacksnorwood.jacks_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
@Profile("dev")
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final MenuCategoryRepository menuCategoryRepository;
    private final MenuSubcategoryRepository menuSubcategoryRepository;
    private final MenuItemRepository menuItemRepository;

    @Override
    @Transactional
    public void run(String... args) {
        seedMenu();
    }

    // ── Menu ──────────────────────────────────────────────────────────────────
    private void seedMenu() {
        if (menuSubcategoryRepository.count() > 0) return;

        if (menuCategoryRepository.count() > 0) {
            log.info("Old menu data found without subcategories — clearing and reseeding...");
            menuItemRepository.deleteAll();
            menuCategoryRepository.deleteAll();
        }

        log.info("Seeding Jack's Norwood menu categories, subcategories and items...");

        // ════════════════════════════════════════════════════════════════════
        // CATEGORIES
        // ════════════════════════════════════════════════════════════════════
        MenuCategory breakfast    = saveC("Breakfast Menu",    "All breakfasts served with a bowl of fruits",  1);
        MenuCategory appetizers   = saveC("Appetizers",        null,                                           2);
        MenuCategory poutines     = saveC("Poutines",          null,                                           3);
        MenuCategory nachos       = saveC("Nachos",            null,                                           4);
        MenuCategory soupsSalads  = saveC("Soups & Salads",    "Choice of dressings: Thousand Island, French, Italian, Ranch, Blue Cheese, Raspberry Vinaigrette & Balsamic Vinaigrette", 5);
        MenuCategory burgers      = saveC("Burgers",           "All burgers are served with your choice of fries, soup or garden salad and garnished with mayo, lettuce, tomato, red onion & sliced pickles. Substitutions: Caesar salad, Greek salad, sweet potato fries, curried fries, French onion soup, or onion rings — $4", 6);
        MenuCategory pastas       = saveC("Pastas",            "All pastas are served with garlic bread & sprinkled with parmesan cheese", 7);
        MenuCategory pizza        = saveC("Pizza",             null,                                           8);
        MenuCategory sandwiches   = saveC("Sandwiches",        "All sandwiches are served with your choice of soup, salad, or fries. Substitutions: Caesar salad, Greek salad, sweet potato fries, curried fries, French onion soup, or onion rings — $4", 9);
        MenuCategory wraps        = saveC("Wraps",             "All wraps are served with your choice of soup, salad, or fries. Substitute: Caesar salad, Greek salad, sweet potato fries, curried fries, French onion soup, or onion rings — $4", 10);
        MenuCategory favourites   = saveC("Jack's Favourites", null,                                          11);
        MenuCategory riceBowls    = saveC("Rice Bowls",        null,                                          12);
        MenuCategory entrees      = saveC("Norwood Entrées",   null,                                          13);
        MenuCategory ribsWings    = saveC("Ribs & Wings",      null,                                          14);

        // ════════════════════════════════════════════════════════════════════
        // SUBCATEGORIES
        // ════════════════════════════════════════════════════════════════════

        // Breakfast subcategories
        MenuSubcategory sigBreakfast  = saveS("Signature Breakfasts",   breakfast,   1);
        MenuSubcategory frenchPancake = saveS("French Toast & Pancakes", breakfast,   2);
        MenuSubcategory brkSandwich   = saveS("Breakfast Sandwiches",   breakfast,   3);
        MenuSubcategory omelettes     = saveS("Omelettes",              breakfast,   4);

        // Soups & Salads subcategories
        MenuSubcategory soups  = saveS("Soups",  soupsSalads, 1);
        MenuSubcategory salads = saveS("Salads", soupsSalads, 2);

        // ════════════════════════════════════════════════════════════════════
        //  BREAKFAST — Signature Breakfasts
        // ════════════════════════════════════════════════════════════════════
        item("Jack's All-Day Breakfast",     "2 eggs, ham, bacon, sausage, grilled tomatoes, toast & hashbrown",                                "13.00", breakfast, sigBreakfast, false, false, true);
        item("Norwood Breakfast Champion",   "4 eggs, 1 pancake, grilled tomatoes, bacon or ham or sausage, double serving of hashbrown",        "19.00", breakfast, sigBreakfast, false, false, false);
        item("Eggs Benedict",                "2 poached eggs, ham, English muffin, hashbrown & hollandaise sauce",                               "15.00", breakfast, sigBreakfast, false, false, true);
        item("Eggs Florentine",              "2 poached eggs, marble cheese, baby spinach, hashbrown & hollandaise sauce",                       "16.00", breakfast, sigBreakfast, false, false, false);
        item("Eggs Benjamin",               "2 poached eggs, smoked salmon, English muffin, hashbrown & hollandaise sauce",                     "20.00", breakfast, sigBreakfast, false, false, false);
        item("Steak & Eggs",                "6 oz steak, 2 eggs, hashbrown & toast",                                                            "20.00", breakfast, sigBreakfast, false, false, false);
        item("Breakfast Wrap",              "2 eggs, green peppers, onions, tomatoes, mixed cheese & hashbrown",                                 "14.00", breakfast, sigBreakfast, false, false, false);

        // ════════════════════════════════════════════════════════════════════
        //  BREAKFAST — French Toast & Pancakes
        // ════════════════════════════════════════════════════════════════════
        item("3 pcs French Toast",           "Add ham, bacon or sausage — $3.00",                                                               "10.00", breakfast, frenchPancake, false, false, false);
        item("Jack's French Toast Special",  "2 eggs, French toast, bacon or sausage & hashbrown",                                              "16.00", breakfast, frenchPancake, false, false, false);
        item("3 pcs Pancakes",               "Add ham, bacon or sausage — $3.00",                                                               "10.00", breakfast, frenchPancake, false, false, false);
        item("Jack's Pancake Special",       "2 eggs, pancake, bacon or sausage & hashbrown",                                                   "16.00", breakfast, frenchPancake, false, false, false);

        // ════════════════════════════════════════════════════════════════════
        //  BREAKFAST — Breakfast Sandwiches
        // ════════════════════════════════════════════════════════════════════
        item("Fried Egg Sandwich & Hashbrown", "Add bacon or cheese — $3.00",                                                                  "10.00", breakfast, brkSandwich, false, false, false);
        item("BLTC Sandwich & Hashbrown",      "Bacon, lettuce, tomato, cheese",                                                               "14.00", breakfast, brkSandwich, false, false, false);
        item("Grilled Cheese Sandwich",        "Add bacon — $3.00",                                                                            "13.00", breakfast, brkSandwich, false, false, false);

        // ════════════════════════════════════════════════════════════════════
        //  BREAKFAST — Omelettes
        // ════════════════════════════════════════════════════════════════════
        item("Plain Omelette",               "Served with hashbrown & toast. Add tomatoes, onions, peppers or mushrooms — $2.00. Add mixed cheese or feta cheese — $3.00. Add ham, bacon or sausage — $3.00. Add smoked salmon — $7.00", "11.00", breakfast, omelettes, false, false, false);
        item("Western Omelette",             "Ham, onions, peppers. Served with hashbrown & toast",                                             "16.00", breakfast, omelettes, false, false, false);
        item("Denver Omelette",              "Ham & green onions. Served with hashbrown & toast",                                               "16.00", breakfast, omelettes, false, false, false);
        item("Mediterranean Omelette",       "Tomatoes, black olives, onions, feta cheese. Served with hashbrown & toast",                      "18.00", breakfast, omelettes, false, false, false);
        item("Benjamin Omelette",            "Smoked salmon, green onions, mixed cheese. Served with hashbrown & toast",                        "22.00", breakfast, omelettes, false, false, false);

        // ════════════════════════════════════════════════════════════════════
        //  APPETIZERS
        // ════════════════════════════════════════════════════════════════════
        item("Cheesy Garlic Bread",          "Add bacon $3 or jalapeño $2",                                                                     "11.00", appetizers, null, false, false, false);
        item("Bruschetta",                   "Garlic, red onion, tomato, olive oil, basil & parmesan cheese on ciabatta bread",                  "14.00", appetizers, null, false, false, false);
        item("Buffalo Bites",               "Boneless chicken thigh, skin on, lightly dusted and deep fried, tossed in a choice of wing sauce",  "16.00", appetizers, null, true,  false, false);
        item("Chili Chicken Bites",          "Dusted chicken bites, peppers and onions cooked in chili sauce, served with garlic bread",         "18.00", appetizers, null, true,  false, false);
        item("Crispy Calamari",              "Lightly breaded calamari rings, peppers & jalapeños fried golden brown. Served with sweet chili sauce", "16.00", appetizers, null, false, false, false);
        item("Fried Pickles",               "Breaded deep-fried pickle spear served with ranch dressing",                                       "15.00", appetizers, null, false, false, false);
        item("Spinach & Artichoke Dip",      "A perfect blend of artichokes, spinach & cream cheese, served with tortilla chips & pita bread",   "16.00", appetizers, null, false, false, false);
        item("Perogies",                    "Sautéed with onion & bacon, melted cheese & drizzled with sour cream",                              "16.00", appetizers, null, false, false, false);
        item("Potato Boats",               "Crispy potato skins loaded with mixed cheese, sweet peppers, bacon & scallions, served with sour cream", "16.00", appetizers, null, false, false, false);
        item("Tempura Shrimps",             "Breaded & golden-fried, served with sweet chili sauce",                                             "16.00", appetizers, null, false, false, false);
        item("Mozzarella Sticks",           "Breaded & golden-fried, served with warm marinara sauce",                                           "16.00", appetizers, null, false, false, false);
        item("Vegetable Quesadilla",        "Soft tortilla stuffed with sweet peppers, tomatoes, scallions, Tex-Mex seasoning, jalapeños & mixed cheese. Add chicken +$5 | Add pulled pork +$5", "14.00", appetizers, null, false, false, false);
        item("Veggie Samosas",              "Spicy vegetarian samosas served with sweet chili sauce",                                            "14.00", appetizers, null, true,  false, false);
        item("Curry Fries",                 "French fries topped with our homemade curry sauce",                                                 "15.00", appetizers, null, false, false, false);

        // ════════════════════════════════════════════════════════════════════
        //  POUTINES
        // ════════════════════════════════════════════════════════════════════
        item("Traditional Poutine",          "Golden French fries with melted cheese curds topped with gravy",                                   "16.00", poutines, null, false, false, false);
        item("Pulled Pork Poutine",          "Traditional poutine with chipotle mayo, BBQ sauce, pulled pork & gravy",                           "22.00", poutines, null, false, false, false);
        item("Butter Chicken Poutine",       "Traditional poutine topped with our signature butter chicken",                                     "22.00", poutines, null, false, false, true);
        item("Buffalo Chicken Poutine",      "Boneless, skin-on lightly dusted chicken bites tossed in buffalo sauce with melted cheese curds & gravy", "23.00", poutines, null, true, false, false);
        item("Curry Chicken Poutine",        "Traditional poutine topped with crispy chicken tossed in our homemade curry sauce",                 "22.00", poutines, null, false, false, false);

        // ════════════════════════════════════════════════════════════════════
        //  NACHOS (items with sizes)
        // ════════════════════════════════════════════════════════════════════
        sizedItem("Nachos",
                "Fresh corn tortilla chips topped with mixed cheese, tomatoes, jalapeños, sweet peppers & green onions. Served with salsa & sour cream. Add butter chicken, grilled chicken, chili or pulled pork — $5",
                "17.00", nachos, null, false, false, true,
                new String[]{"Small", "17.00"}, new String[]{"Large", "23.00"});
        sizedItem("Irish Nachos",
                "Crispy lattice fries loaded with mixed cheese, crispy bacon, green onions, tomatoes & sweet peppers. Drizzled with sour cream. Add butter chicken, grilled chicken, chili or pulled pork — $5",
                "18.00", nachos, null, false, false, false,
                new String[]{"Small", "18.00"}, new String[]{"Large", "24.00"});
        sizedItem("Mediterranean Nachos",
                "Fresh corn tortilla chips topped with mixed cheese, herbs, red onions, green onions, sliced black olives, feta cheese & jalapeños. Served with salsa & sour cream. Add butter chicken, grilled chicken, chili or pulled pork — $5",
                "18.00", nachos, null, false, false, false,
                new String[]{"Small", "18.00"}, new String[]{"Large", "24.00"});

        // ════════════════════════════════════════════════════════════════════
        //  SOUPS
        // ════════════════════════════════════════════════════════════════════
        item("Soup of the Day",              "Creation made in our kitchen",                                                                     "7.00",  soupsSalads, soups, false, false, false);
        item("French Onion Soup",            "Topped with croutons & Swiss cheese",                                                              "9.00",  soupsSalads, soups, false, false, false);

        // ════════════════════════════════════════════════════════════════════
        //  SALADS (some with sizes)
        // ════════════════════════════════════════════════════════════════════
        sizedItem("Mixed Greens",
                "Mixed greens, tomatoes, sweet peppers, cucumbers & red onions. Add grilled chicken $6 • Add shrimp $8 • Add steak $8 • Add salmon $8",
                "10.00", soupsSalads, salads, false, false, false,
                new String[]{"Starter", "10.00"}, new String[]{"Meal", "15.00"});
        sizedItem("Brooklin Caesar",
                "Romaine hearts, Caesar dressing, herbed croutons & parmesan cheese. Add grilled chicken $6 • Add shrimp $8 • Add steak $8 • Add salmon $8",
                "12.00", soupsSalads, salads, false, false, false,
                new String[]{"Starter", "12.00"}, new String[]{"Meal", "17.00"});
        sizedItem("Greek Salad",
                "Romaine hearts, crumbled feta cheese, sweet peppers, tomatoes, cucumber, red onions, kalamata olives & Greek dressing. Add grilled chicken $6 • Add shrimp $8 • Add steak $8 • Add salmon $8",
                "12.00", soupsSalads, salads, false, false, false,
                new String[]{"Starter", "12.00"}, new String[]{"Meal", "17.00"});
        item("Crispy Chicken Salad",         "Mixed greens, crispy chicken, bacon, mixed cheese, sweet peppers, tomatoes, cucumber & red onions", "20.00", soupsSalads, salads, false, false, false);
        item("Julienne Salad",              "Mixed greens, turkey, ham, roast beef, mixed cheese, tomatoes, cucumbers, red onions & hard-boiled egg", "22.00", soupsSalads, salads, false, false, false);

        // ════════════════════════════════════════════════════════════════════
        //  BURGERS
        // ════════════════════════════════════════════════════════════════════
        item("Classic Burger",               "Handmade 7oz prime rib burger",                                                                   "16.00", burgers, null, false, false, false);
        item("Jack's Burger",                "Bacon, mushroom & marble cheese",                                                                  "20.00", burgers, null, false, false, true);
        item("Forty Creek BBQ Burger",       "Forty Creek BBQ sauce, caramelized onions, sautéed mushroom & marble cheese",                      "20.00", burgers, null, false, false, false);
        item("Banquet Burger",               "Bacon & marble cheese",                                                                            "20.00", burgers, null, false, false, false);
        item("Veggie Burger",               "Garden burger, mushrooms, caramelized onions, Forty Creek BBQ sauce & marble cheese",                "16.00", burgers, null, false, false, false);
        item("Jack's Grand Slam Burger",     "Double bacon, double sautéed mushroom & double cheese",                                            "28.00", burgers, null, false, false, false);

        // ════════════════════════════════════════════════════════════════════
        //  PASTAS
        // ════════════════════════════════════════════════════════════════════
        item("Penne Arrabbiata",             "Red onions, jalapeños, chicken, chorizo & peppers in tomato sauce",                                 "20.00", pastas, null, true,  false, false);
        item("Baked Cheese Tortellini",      "Smothered in rosé sauce & baked with cheese",                                                      "20.00", pastas, null, false, false, false);
        item("Butternut Squash Agnolotti",   "Sautéed peppers and onions in a sage butter cream sauce",                                          "20.00", pastas, null, false, false, false);
        item("Curry Chicken Fettuccine",     "Grilled chicken, sautéed onions & peppers tossed in a curry cream sauce",                          "22.00", pastas, null, false, false, false);
        item("Shrimp Fettuccine",            "Shrimps, sautéed peppers and onions tossed in alfredo sauce",                                      "22.00", pastas, null, false, false, false);
        item("Mushroom Ravioli",             "Jumbo mushroom ravioli with sautéed peppers and onions, tossed in a creamy Alfredo sauce",          "22.00", pastas, null, false, false, false);
        item("Chicken Fettuccine Alfredo",   "Tomato, bacon, grilled chicken in alfredo sauce",                                                  "22.00", pastas, null, false, false, false);
        item("Bacon Mac and Cheese",         "Bacon, macaroni pasta smothered in alfredo sauce baked with cheese",                               "22.00", pastas, null, false, false, false);
        item("Lasagna",                     "Homemade beef lasagna served with caesar salad & garlic bread",                                      "22.00", pastas, null, false, false, false);
        item("Lobster Mac & Cheese",         "Lobster, macaroni pasta smothered in alfredo sauce baked with cheese",                              "23.00", pastas, null, false, false, false);
        item("Lobster Pasta",               "Fettuccine with lobster tail, tomato, peppers & onion in rosé sauce",                                "30.00", pastas, null, false, false, false);

        // ════════════════════════════════════════════════════════════════════
        //  PIZZA
        // ════════════════════════════════════════════════════════════════════
        item("Mediterranean Pizza",         "Spread of tzatziki sauce, topped with grilled chicken, bruschetta mix, sliced black olives & feta cheese", "18.00", pizza, null, false, false, false);
        item("Butter Chicken Pizza",         "Butter chicken, mixed cheese & bruschetta mix",                                                    "18.00", pizza, null, false, false, false);
        item("Grilled Chicken Pizza",        "Tomato sauce, grilled chicken, bruschetta mix & mixed cheese",                                     "18.00", pizza, null, false, false, false);
        item("Meat Lovers Pizza",            "Tomato sauce, pepperoni, chorizo, bacon & mixed cheese",                                           "18.00", pizza, null, false, false, false);
        item("Pulled Pork Pizza",            "Chipotle mayo, Forty Creek BBQ pulled pork, caramelized onions & mixed cheese",                    "18.00", pizza, null, false, false, false);

        // ════════════════════════════════════════════════════════════════════
        //  SANDWICHES
        // ════════════════════════════════════════════════════════════════════
        item("BBQ Chicken on a Kaiser",      "Grilled chicken breast brushed with Forty Creek BBQ sauce, garnished with mayo, lettuce, tomatoes, onions & pickle", "20.00", sandwiches, null, false, false, false);
        item("Pub Club",                    "Chicken, bacon, lettuce, tomato & mayo on your choice of white, rye, or whole wheat",                "19.00", sandwiches, null, false, false, false);
        item("Pulled Pork Sandwich",         "BBQ pulled pork, caramelized onions, mixed cheese & chipotle mayo on a garlic ciabatta bun",       "18.00", sandwiches, null, false, false, false);
        item("Steak Sandwich",              "6oz New York strip loin topped with sautéed mushrooms and caramelized onions on a garlic ciabatta bun", "25.00", sandwiches, null, false, false, false);
        item("Gourmet Grilled Cheese",       "Bacon, tomato, Swiss and marble cheese on choice of white, rye, or whole wheat",                   "17.00", sandwiches, null, false, false, false);
        item("Reuben",                      "Corned beef, sauerkraut, Swiss cheese & thousand island sauce on marble rye bread",                  "19.00", sandwiches, null, false, false, false);
        item("BLT",                         "Bacon, lettuce, tomato, cheese & garlic aioli. Choice of white, whole wheat or rye bread",           "17.00", sandwiches, null, false, false, false);
        item("Beef Dip",                    "Roast beef, caramelized onions & Swiss cheese on a kaiser bun served with au jus",                   "19.00", sandwiches, null, false, false, false);
        item("Hot & Spicy Chicken Sandwich", "Spicy breaded chicken breast tossed in buffalo sauce on a kaiser, garnished with mayo, lettuce, tomatoes, onions & pickle", "18.00", sandwiches, null, true, false, false);
        item("Cold Cut Sandwich",            "Turkey, ham, bacon, lettuce, tomato & mayo on your choice of white, rye or multigrain bread",       "19.00", sandwiches, null, false, false, false);
        item("Hot Sandwich",                "Choice of hamburger or roast beef, served open-faced on white bread with mashed potatoes, vegetables, and mushroom gravy", "20.00", sandwiches, null, false, false, false);

        // ════════════════════════════════════════════════════════════════════
        //  WRAPS
        // ════════════════════════════════════════════════════════════════════
        item("Mediterranean Wrap",           "Grilled chicken, bruschetta mix, lettuce, black olives, feta cheese & tzatziki",                   "19.00", wraps, null, false, false, false);
        item("BLT Wrap",                    "Chipotle mayo, grilled bacon, lettuce, tomato & mixed cheese",                                      "17.00", wraps, null, false, false, false);
        item("Club Wrap",                   "Chipotle mayo, chicken, bacon, lettuce, tomato & mixed cheese",                                     "19.00", wraps, null, false, false, false);
        item("Chicken Caesar Wrap",          "Crispy chicken, Caesar dressing, romaine lettuce & parmesan cheese",                                "19.00", wraps, null, false, false, false);
        item("Pulled Pork Wrap",             "Chipotle mayo, Forty Creek BBQ pulled pork, caramelized onions, lettuce & mixed cheese",            "19.00", wraps, null, false, false, false);
        item("Crispy Ranch Wrap",            "Ranch, lettuce, crispy chicken, bacon & mixed cheese",                                              "19.00", wraps, null, false, false, false);
        item("Chipotle Wrap",               "Chipotle mayo, lettuce, crispy chicken, green onions & mixed cheese",                                "19.00", wraps, null, false, false, false);
        item("Cajun Wrap",                  "Chipotle mayo, lettuce, grilled chicken, tomato, mixed cheese & caramelized onions with Cajun seasoning", "19.00", wraps, null, false, false, false);
        item("Forty Creek BBQ Wrap",         "Chipotle mayo, lettuce, grilled chicken, tomato, mixed cheese & caramelized onions with Forty Creek BBQ", "19.00", wraps, null, false, false, false);
        item("Cold Cut Wrap",               "Mayo, ham, turkey, bacon, lettuce, tomato & mixed cheese",                                           "18.00", wraps, null, false, false, false);
        item("Buffalo Chicken Wrap",         "Chipotle mayo, lettuce, tomato, crispy chicken tossed in buffalo sauce & mixed cheese",              "19.00", wraps, null, true, false, false);

        // ════════════════════════════════════════════════════════════════════
        //  JACK'S FAVOURITES (some with sizes)
        // ════════════════════════════════════════════════════════════════════
        item("Guinness Steak & Mushroom Pie","Tender cuts of beef tenderloin, sautéed mushrooms with Guinness gravy in a flaky pastry, served with mashed potatoes, veggies & gravy", "20.00", favourites, null, false, false, true);
        item("Shepherd's Pie",              "A flavorful beef stew topped with creamy mashed potatoes, parmesan cheese, gravy & veggies",          "20.00", favourites, null, false, false, false);
        item("Chicken Pot Pie",             "Boneless chicken, green peas cooked in cream sauce in a flaky pastry served with mashed potatoes & veggies", "20.00", favourites, null, false, false, false);
        sizedItem("Fish & Chips",
                "Jack's crispy beer battered haddock fillets served with tartar sauce & coleslaw",
                "15.00", favourites, null, false, false, true,
                new String[]{"1 Pc", "15.00"}, new String[]{"2 Pc", "20.00"});
        item("Bangers & Mash",              "English style farmer's sausage, baked beans, sautéed onions & mashed potatoes",                     "18.00", favourites, null, false, false, false);
        item("Pot Roast & Yorkshire",       "Pot roast beef served in a Yorkshire boat with gravy, mashed potatoes & veggies",                    "22.00", favourites, null, false, false, false);
        item("Chicken Fingers",             "Breaded chicken tenders served with fries & plum sauce",                                             "18.00", favourites, null, false, false, false);
        item("Liver & Onions",              "Pan seared beef liver topped with caramelized onions, bacon, and gravy served with mashed potatoes & veggies", "20.00", favourites, null, false, false, false);

        // ════════════════════════════════════════════════════════════════════
        //  RICE BOWLS
        // ════════════════════════════════════════════════════════════════════
        item("Jambalaya",                   "Chorizo, shrimp, chicken & house mixed Creole spices, served on a bed of rice",                      "22.00", riceBowls, null, false, false, false);
        item("Jack's Chicken Curry",         "Our chef's own style curry served with basmati rice, garnished with cucumbers, tomatoes, lettuce & pita bread", "22.00", riceBowls, null, false, false, true);
        item("Butter Chicken",              "A mild Marsala-spiced butter chicken served on a bed of rice & pita bread",                          "22.00", riceBowls, null, false, false, true);
        item("Chili Chicken",               "Lightly dusted chicken, peppers & onions sautéed in chili sauce, served with your choice of rice or noodles with pita bread", "22.00", riceBowls, null, true, false, false);
        item("Veggie Stir Fry",             "Fresh mixed vegetables sautéed in teriyaki sauce, served on basmati rice. Add grilled chicken $6 • Add shrimp $8 • Add steak $8", "16.00", riceBowls, null, false, false, false);

        // ════════════════════════════════════════════════════════════════════
        //  NORWOOD ENTRÉES
        // ════════════════════════════════════════════════════════════════════
        item("10oz New York Steak",          "New York strip loin grilled to your perfection, topped with brandy peppercorn sauce. Served with mashed potatoes & veggies. Add garlic shrimp $6 • Lobster $10", "32.00", entrees, null, false, false, false);
        item("Pan-Fried Salmon",             "Fresh salmon prepared in dill cream sauce, served with rice & veggies",                             "28.00", entrees, null, false, false, false);
        item("Pad Thai",                    "Chicken, shrimp, peppers & onions mixed with spicy Pad Thai sauce, topped with scallions & cilantro", "22.00", entrees, null, true, false, false);
        item("Veal Schnitzel",              "Breaded veal cutlet served with mushroom sauce, mashed potatoes & vegetables",                       "24.00", entrees, null, false, false, false);
        item("Chicken Schnitzel",            "Breaded chicken cutlet served with mushroom sauce, mashed potatoes & vegetables",                    "22.00", entrees, null, false, false, false);
        item("Austrian Schnitzel",           "Breaded veal cutlet served with lemon wedges, mashed potatoes & vegetables",                        "24.00", entrees, null, false, false, false);
        item("Chicken Souvlaki",             "Marinated grilled chicken tenders served with rice, Greek salad & tzatziki",                        "22.00", entrees, null, false, false, false);
        item("Lobster Dinner",              "Two 4oz lobster tails served with mashed potatoes & vegetables",                                     "32.00", entrees, null, false, false, false);
        item("Chicken Parmigiana",           "Served with tomato fettuccine & garlic bread",                                                      "22.00", entrees, null, false, false, false);
        item("Veal Parmigiana",              "Served with tomato fettuccine & garlic bread",                                                      "23.00", entrees, null, false, false, false);
        item("Jerk ½ Chicken",              "Jerk-marinated half chicken served with rice & Greek salad",                                         "20.00", entrees, null, true, false, false);

        // ════════════════════════════════════════════════════════════════════
        //  RIBS & WINGS (items with sizes)
        // ════════════════════════════════════════════════════════════════════
        sizedItem("Jack's Wings",
                "Jack's famous wings, marinated in our signature spices for 24 hours and tossed in any of our sauces. Sauces: Mild BBQ, Forty Creek BBQ, Honey Garlic, Medium, Jerk, Sweet Chili, Hot, Jaffna Hot (Habanero), Tiger (Ghost Pepper), Buffalo Ranch, Spicy Caesar. Dry spices: Cajun, Salt & Pepper, Lemon Pepper, Roasted Garlic & Parmesan",
                "15.00", ribsWings, null, false, false, true,
                new String[]{"1 lb", "15.00"}, new String[]{"2 lbs", "29.00"});
        sizedItem("Succulent Side Ribs",
                "Slow-cooked side ribs smothered in Forty Creek BBQ sauce. Served with coleslaw & fries",
                "20.00", ribsWings, null, false, false, true,
                new String[]{"Half Rack", "20.00"}, new String[]{"Full Rack", "28.00"});
        item("Ribs & Wings",               "A ½ rack of ribs smothered in Forty Creek BBQ sauce & ½ pound of our wings tossed in any of our sauces. Served with coleslaw & fries", "25.00", ribsWings, null, false, false, false);

        log.info("Menu seeding complete — {} categories, {} subcategories, {} items.",
                menuCategoryRepository.count(), menuSubcategoryRepository.count(), menuItemRepository.count());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private MenuCategory saveC(String name, String desc, int order) {
        return menuCategoryRepository.save(
                MenuCategory.builder().name(name).description(desc).displayOrder(order).build());
    }

    private MenuSubcategory saveS(String name, MenuCategory cat, int order) {
        return menuSubcategoryRepository.save(
                MenuSubcategory.builder().name(name).category(cat).displayOrder(order).build());
    }

    private void item(String name, String desc, String price,
                      MenuCategory cat, MenuSubcategory subcat,
                      boolean spicy, boolean vegan, boolean popular) {
        menuItemRepository.save(MenuItem.builder()
                .name(name).description(desc).price(new BigDecimal(price))
                .category(cat).subcategory(subcat)
                .isPopular(popular).isSpicy(spicy).isVegan(vegan).isActive(true).build());
    }

    /**
     * Creates a menu item with size variants (e.g. Small/Large, 1 Pc/2 Pc).
     * The base price is set to the first size's price; individual sizes are
     * persisted via cascade on MenuItem → ItemSize.
     */
    private void sizedItem(String name, String desc, String basePrice,
                           MenuCategory cat, MenuSubcategory subcat,
                           boolean spicy, boolean vegan, boolean popular,
                           String[]... sizes) {
        MenuItem mi = MenuItem.builder()
                .name(name).description(desc).price(new BigDecimal(basePrice))
                .category(cat).subcategory(subcat)
                .isPopular(popular).isSpicy(spicy).isVegan(vegan).isActive(true).build();
        for (String[] sz : sizes) {
            mi.getSizes().add(ItemSize.builder()
                    .name(sz[0]).price(new BigDecimal(sz[1])).menuItem(mi).build());
        }
        menuItemRepository.save(mi);
    }
}
