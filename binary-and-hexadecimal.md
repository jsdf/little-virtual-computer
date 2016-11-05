Before explaining how computers load data into their working space and process it, it's valuable to understand binary and hexadecimal numbers. This is because computer hardware only understands binary values due to the physical characteristics of the electronic circuitry used to implement them. I won't go further into explaining the reasons why computer hardware works with values in binary form, but you can read more about it [here](http://nookkin.com/articles/computer-science/why-computers-use-binary.ndoc).

So what is binary? Binary is a 'base-2 number system'. But what does that mean?

Consider the number system we are all accustomed to using in our everyday lives, which is sometimes called the decimal system or base-10. It uses the digits 0, 1, 2, 3, 4, 5, 6, 7, 8, and 9 to represent the first 10 integers (whole-numbers) starting from zero. It is called base-10 because we have 10 digits to work with, from 0 to 9. But what happens after 9? With the number 10 we move over one column to the left, placing a '1' in the 'tens column' followed by a '0' in the 'ones column'. If we continue to increase our number in increments of 1, the digit in the 'ones column' moves through the digits 0-9, until we get to 20, and so on until we eventually get to 100, placing a 1 in the 'hundreds column'.

Binary, or base-2, is much the same, except the only digits we have to work with are 0 and 1. Then how do we count? It's actually the same as in base-10, but after 0, then 1, we get to 10. Why? Because we have moved through all the digits we have to work with in the 'ones column', so we put a 1 in the next column to the left. However, in binary, that column is not the 'tens column', but rather the 'twos column'. In the same way that in the decimal number 20 we are basically saying that we have 'two tens and zero ones', in the binary number 10 we are saying that we have 'one twos and zero ones'. Next comes 11 (one twos and one ones) then 100 (one fours, zero twos, and zero ones).

   0
   1
  10
  11
 100
 101

If it seems confusing that the columns, from right to left are 'ones', 'two', 'fours', rather than 'ones', 'tens', 'hundreds' consider that in base-10 we only need a tens column once we've exhausted all of the digits we can put in the ones column (0-9) once we reach the number 9, and the next whole number after 9 is 10, but in base-2 we only have 0 and 1, so after 0, then 1, we have exhausted all the digits for the ones column, and the next number we want to represent is the number that (in base-10) we would call 'two'. By calling it the 'twos column' we're still using the base-10 name for that number. It's valuable to understand that each number can be represented in both base-2 and base-10, or any other base for that matter, and the only difference is how we write them in digits (or however else we are recording them, such as in the two positions of a switch). As we continue on to larger and larger numbers we have the columns ones, twos, fours, eights, 16s, 32s, 64s and so on. You might recognise these as the powers of 2. 

Hexadecimal (base-16) is much like binary and decimal, except that there are 16 digits: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, a, b, c, d, e, and f. After 9 we start using letters of the alphabet to fill out the remaining digits to bring us to a total of 16. This means that as we are counting, after 9 we don't go to 10, but instead a, then b, c, e, and finally f, before getting to 10. Instead of the column to the left of the ones column being the tens column, in hexadecimal it is the '16s column'. Once we have moved through 0 to f in that column (moving through 0 to f in the ones column for each digit in the 16s column), the next column is the 
256s, 4096s, 65536s, and so on, moving up in the powers of 16. As the columns in binary (base-2) go up in powers of 2 as we move to the left, and the columns in decimal (base-10) in powers of 10, it makes sense that the columns in hexadecimal go up in powers of 16.

     hex        binary    decimal
       0             0          0
       1             1          1
       2            10          2
       3            11          3
       4           100          4
       5           101          5
       6           110          6
       7           111          7
       8          1000          8
       9          1001          9
       a          1010         10
       b          1011         11
       c          1100         12
       d          1101         13
       e          1110         14 
       f          1111         15
      10        1 0000         16
      11        1 0001         17
      12        1 0010         18
      13        1 0011         19
      14        1 0100         20
      15        1 0101         21
      16        1 0110         22
      17        1 0111         23
      18        1 1000         24
      19        1 1001         25
      1a        1 1010         26
      1b        1 1011         27
      1c        1 1100         28
      1d        1 1101         29
      1e        1 1110         30
      1f        1 1111         31
      20       10 0000         32
      21       10 0001         33
     ...           ...        ...
      3f       11 1111         63
      40      100 0000         64
      41      100 0001         65
     ...           ...        ...
      7f      111 1111        127
      80     1000 0000        128
      81     1000 0001        129
     ...           ...        ...
      f8     1111 1000        248
      f9     1111 1001        249
      fa     1111 1010        250
      fb     1111 1011        251
      fc     1111 1100        252
      fd     1111 1101        253
      fe     1111 1110        254
      ff     1111 1111        255
     100   1 0000 0000        256
     101   1 0000 0001        257

If you've ever wondered why power-of-2 numbers like 8, 16, 32, 64, and 256 come up a lot in computer programming, have a look at the binary and hex representations which those decimal values line up with. You'll see that there are 16 values (0-15, because we start counting at zero) which can be represented with (or 'fit inside') 4 binary digits, or 1 hex digit, and 256 values (0-255) which fit inside 8 binary digits/2 hex digits.
