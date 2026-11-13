library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    port (
        clk : in std_logic;
        reset : in std_logic;
        sample : in std_logic_vector(7 downto 0);
        captured : out std_logic_vector(7 downto 0);
        previous : out std_logic_vector(7 downto 0)
    );
end entity;

architecture rtl of top_module is
begin
    process(clk) begin if rising_edge(clk) then if reset='1' then captured<=(others=>'0'); previous<=(others=>'0'); else captured<=sample; previous<=captured; end if; end if; end process;
end architecture;
