library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity parity8 is
    port (
    data : in std_logic_vector(7 downto 0);
    parity : in std_logic;
    error : out std_logic
    );
end entity;
architecture rtl of parity8 is
    begin
    error <= (xor data) xor parity;
end architecture;
