library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    port (
        a : in std_logic_vector(7 downto 0);
        b : in std_logic_vector(7 downto 0);
        sum : out std_logic_vector(7 downto 0);
        difference : out std_logic_vector(7 downto 0);
        a_less_b : out std_logic;
        equal : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    sum <= std_logic_vector(unsigned(a)+unsigned(b)); difference <= std_logic_vector(unsigned(a)-unsigned(b)); a_less_b <= '1' when unsigned(a)<unsigned(b) else '0'; equal <= '1' when a=b else '0';
end architecture;
