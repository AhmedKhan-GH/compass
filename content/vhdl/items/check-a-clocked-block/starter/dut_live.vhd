library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity sample_register is
    port (
    clk : in std_logic;
    reset : in std_logic;
    data : in std_logic_vector(7 downto 0);
    q : out std_logic_vector(7 downto 0)
    );
end entity;
architecture rtl of sample_register is
    begin
    q <= (others=>'0')
when reset='1'
else data;
end architecture;
