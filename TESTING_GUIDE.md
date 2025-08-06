# Guest Order Testing Guide

## Current Status
✅ **Database policies cleaned up** - Orders table now has proper policies for guest orders
✅ **Frontend implementation complete** - Guest email field and validation implemented
✅ **Development server running** - Available at http://localhost:3001

## Testing Steps

### 1. Test Guest Order Flow (Primary Test)
1. **Open browser** and go to `http://localhost:3001`
2. **Navigate to any product** (click on a product card)
3. **Ensure you're NOT logged in** (no user profile visible in navigation)
4. **Click "Order Now" button**
5. **Verify the order modal opens** with these fields:
   - ✅ Customer Name
   - ✅ **Email Address** (should be visible for guests)
   - ✅ Delivery Address  
   - ✅ Phone Number
   - ✅ Quantity selector

### 2. Test Form Validation
1. **Try submitting empty form** - should show validation errors
2. **Enter invalid email** (e.g., "test") - should show email validation error
3. **Enter valid email** (e.g., "test@example.com") - should show green checkmark
4. **Fill all fields correctly** and submit

### 3. Test Order Submission
1. **Fill the form completely**:
   - Name: "John Doe"
   - Email: "john@example.com" 
   - Address: "123 Main Street, City, Country"
   - Phone: "03001234567"
   - Quantity: 1
2. **Click "Place Order"**
3. **Expected result**: Success message should appear
4. **Check email**: Admin should receive order notification at zeene.contact@gmail.com

### 4. Test Logged-in User Flow (Regression Test)
1. **Go to `/login`** and log in with existing account
2. **Navigate to product page**
3. **Click "Order Now"**
4. **Verify email field is HIDDEN** (should not appear for logged-in users)
5. **Submit order** - should work as before

### 5. Database Verification
Check your Supabase dashboard:
1. **Go to Table Editor > orders**
2. **Look for recent orders**
3. **Guest orders should have**:
   - `user_id`: NULL
   - `customer_name`: Filled
   - Other fields: Filled normally
4. **Logged-in user orders should have**:
   - `user_id`: Valid UUID
   - All other fields: Filled normally

## Expected Behavior

### ✅ Guest Users:
- Can access product pages without login
- See email field in order form
- Can submit orders successfully
- Receive order confirmation emails
- Orders saved with `user_id = NULL`

### ✅ Logged-in Users:
- Email field hidden in order form
- Use authenticated email automatically
- Orders saved with their `user_id`
- All existing functionality preserved

## Troubleshooting

### If Order Submission Fails:
1. **Check browser console** for JavaScript errors
2. **Check network tab** for API call failures
3. **Verify database policies** in Supabase dashboard
4. **Check server logs** in terminal

### If Email Field Not Showing:
1. **Ensure you're logged out** (check navigation bar)
2. **Clear browser cache** and refresh
3. **Check browser console** for React errors

### If Database Errors:
1. **Verify RLS policies** match the ones shown above
2. **Check if orders table allows NULL user_id**
3. **Test database connection** in Supabase dashboard

## Success Criteria
- ✅ Guest users can place orders without authentication
- ✅ Email field appears only for guests
- ✅ Order validation works correctly
- ✅ Orders are saved to database
- ✅ Email notifications are sent
- ✅ Logged-in user flow unchanged
- ✅ Admin can view all orders (including guest orders)

## Next Steps After Testing
1. **If tests pass**: Ready for production deployment
2. **If issues found**: Check troubleshooting section above
3. **Optional enhancements**: 
   - Guest order tracking by email
   - Account creation prompt after guest order
   - Enhanced admin dashboard for guest orders