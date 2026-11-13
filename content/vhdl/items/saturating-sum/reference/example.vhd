library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    port (
        a : in std_logic_vector(7 downto 0);
        b : in std_logic_vector(7 downto 0);
        result : out std_logic_vector(7 downto 0);
        saturated : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    process(all) variable total: unsigned(8 downto 0); begin total := resize(unsigned(a),9)+resize(unsigned(b),9); saturated <= total(8); if total(8)='1' then result<=x"FF"; else result<=std_logic_vector(total(7 downto 0)); end if; end process;
end architecture;
