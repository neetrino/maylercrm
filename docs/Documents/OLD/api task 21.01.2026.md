Нам было бы удобнее, если бы Apartment details были частью Apartments list by Building, чтобы при получении квартир здания мы сразу получали всю подробную информацию, такую как:

Deal Date

Ownership Name

EMail

Passport/Tax No

Phone

Перевод на русский:

В финальной версии я вижу это так: +... это те пункты, которые должны быть добавлены, учитывая выше сказанное.



#### 1. Districts list
method 		"GET"
parameter	""
answer		`id`, `slug`, `name`, `created_at`, `updated_at`



#### 2. Buildings list by District
method		GET
parameter	`district_id`
answer		`id`, `slug`, `name`, `district_id`, `district_slug`, `created_at`, `updated_at`



#### 3. Apartments list by Building
method		GET
parameter	`building_id`
answer 		`id`, `apartment_no`, `status`, `sqm`, `price_sqm`, `total_price`, `building_id`, `building_slug`, `district_id`, `district_slug` +...



#### 4. Apartment details
method		GET
parameter	`apartment_id`
answer		`id`, `apartment_no`, `status`, `sqm`, `price_sqm`, `total_price`, `building_id`, `building_slug`, `district_id`, `district_slug` +...



#### 5. Apartment status update
method		PUT
parameter	`apartment_id`
body		`status`, +...
answer		`id`, `status`, `updated_at`