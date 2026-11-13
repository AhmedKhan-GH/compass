library ieee;
use ieee.std_logic_1164.all;
entity top_module is
    port (
    old_status : in std_logic_vector(7 downto 0);
    selection : in std_logic_vector(7 downto 0);
    updates : in std_logic_vector(7 downto 0);
    shown : out std_logic_vector(7 downto 0);
    merged : out std_logic_vector(7 downto 0)
    );
end entity;
architecture rtl of top_module is
    begin
    -- TODO: implement the required behavior.
    shown <= (others => '0');
    merged <= (others => '0');
end architecture;
