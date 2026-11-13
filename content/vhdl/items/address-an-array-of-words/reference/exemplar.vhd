library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (address:in std_logic_vector(2 downto 0);
    data,packed_byte:out std_logic_vector(7 downto 0));
end entity;
architecture rtl of top_module is
    type words_t is array(0 to 7)of std_logic_vector(7 downto 0);
    constant words:words_t:=(x"10",x"21",x"32",x"43",x"54",x"65",x"76",x"87");
    constant flat_word:std_logic_vector(63 downto 0):=x"0123456789ABCDEF";
    begin
    data<=words(to_integer(unsigned(address)));
    packed_byte<=flat_word(to_integer(unsigned(address))*8+7 downto to_integer(unsigned(address))*8);
end architecture;
