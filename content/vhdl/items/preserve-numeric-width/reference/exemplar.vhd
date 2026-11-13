library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    port (
        a : in std_logic_vector(7 downto 0);
        b : in std_logic_vector(7 downto 0);
        full_sum : out std_logic_vector(8 downto 0);
        wrapped : out std_logic_vector(7 downto 0);
        carry : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    full_sum <= std_logic_vector(resize(unsigned(a),9)+resize(unsigned(b),9)); wrapped <= full_sum(7 downto 0); carry <= full_sum(8);
end architecture;
