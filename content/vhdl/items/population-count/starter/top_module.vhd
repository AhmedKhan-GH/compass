library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (
        lamps : in std_logic_vector(11 downto 0);
        limit : in std_logic_vector(3 downto 0);
        count : out std_logic_vector(3 downto 0);
        over_limit : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    count <= (others => '0'); -- TODO: count every asserted lamp
    over_limit <= '0'; -- TODO: compare the completed count with the limit
end architecture;
