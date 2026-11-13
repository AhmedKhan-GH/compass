library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    port (
        clk : in std_logic;
        reset : in std_logic;
        sample : in std_logic_vector(7 downto 0);
        delayed : out std_logic_vector(7 downto 0)
    );
end entity;

architecture rtl of top_module is
begin
    process(clk) variable stage_one: std_logic_vector(7 downto 0); begin if rising_edge(clk) then if reset='1' then stage_one:=(others=>'0'); delayed<=(others=>'0'); else delayed<=stage_one; stage_one:=sample; end if; end if; end process;
end architecture;
