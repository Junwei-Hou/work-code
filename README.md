# work-code
This is code skills learned from work for reviewing

# code for allocating players into game room and areas
room play rules:
set MaxNumber and WarnNumber, firstly, users will jump into room, and then go into each area in room, the hierarchy is room => area
there are 3 collections, 'rooms_users' 'rooms_areas' 'rooms_area_users'
 1. if all users in areas reach MaxNumber, then create new area enable user to go in
 2. if there are users in areas below WarnNumber, then user will go in as priority 
 3. if all areas users in there which is over WarnNumber and below MaxNumber, then user will go in

# code for calling data from chatgpt in China for node nest.js 
